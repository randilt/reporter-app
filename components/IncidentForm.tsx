"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  AlertTriangle,
  Camera,
  Loader2,
  CheckCircle,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useReports } from "@/hooks/useReports";
import {
  type IncidentType,
  type Severity,
  getDefaultSeverity,
  incidentTypeLabels,
  severityConfig,
} from "@/lib/db";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {
  compressImageToBase64,
  validateImageFile,
  formatFileSize,
} from "@/lib/image-utils";
import { toast } from "sonner";

interface IncidentFormProps {
  onSuccess?: () => void;
}

export const IncidentForm = ({ onSuccess }: IncidentFormProps) => {
  const {
    location,
    loading: locationLoading,
    error: locationError,
    getLocation,
  } = useGeolocation();
  const { createReport } = useReports();
  const t = useTranslations("IncidentForm");

  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [description, setDescription] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [overrideTime, setOverrideTime] = useState(false);
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageCompressing, setImageCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-set severity based on incident type
  useEffect(() => {
    if (incidentType) {
      setSeverity(getDefaultSeverity(incidentType));
    }
  }, [incidentType]);

  // Get location on mount
  useEffect(() => {
    getLocation().catch(() => {});
  }, [getLocation]);

  // Handle image file selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file, 10); // Max 10MB
    if (!validation.valid) {
      toast.error("Invalid image", {
        description: validation.error,
      });
      return;
    }

    setImageCompressing(true);

    try {
      // Compress image with aggressive settings
      const compressed = await compressImageToBase64(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.6,
        outputFormat: "image/jpeg",
      });

      setUploadedImage(compressed.base64);

      // Show compression stats
      toast.success("Image compressed", {
        description: `${formatFileSize(
          compressed.originalSize
        )} → ${formatFileSize(compressed.compressedSize)} (${Math.round(
          (1 - compressed.compressionRatio) * 100
        )}% reduction)`,
      });
    } catch (error) {
      console.error("Image compression failed:", error);
      toast.error("Failed to compress image", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setImageCompressing(false);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require either GPS location or manual address
    if (!incidentType || !severity || (!location && !manualAddress.trim()))
      return;

    setSubmitting(true);

    try {
      const now = new Date();
      await createReport({
        incidentType,
        severity,
        description: description || undefined,
        manualAddress: manualAddress.trim() || undefined,
        locationCapturedAtCreation: location || {
          lat: 0,
          lng: 0,
          accuracyMeters: 0,
        },
        deviceTime: now.toISOString(),
        userCorrectedTime:
          overrideTime && customTime
            ? new Date(customTime).toISOString()
            : null,
        images: uploadedImage ? [uploadedImage] : undefined, // Add image to array
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 glow-success"
        >
          <CheckCircle className="w-10 h-10 text-success" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2">{t("reportSaved")}</h3>
        <p className="text-muted-foreground">{t("reportSavedDesc")}</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Incident Type */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          {t("incidentType")}
        </Label>
        <Select
          value={incidentType}
          onValueChange={(v) => setIncidentType(v as IncidentType)}
        >
          <SelectTrigger className="h-14 text-lg bg-secondary border-border hover:border-primary/50 transition-colors">
            <SelectValue placeholder={t("selectIncidentType")} />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(incidentTypeLabels) as IncidentType[]).map((type) => (
              <SelectItem key={type} value={type} className="py-3 text-base">
                {t(`incidentTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">{t("severityLevel")}</Label>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(severityConfig) as Severity[]).map((sev) => {
            const isSelected = severity === sev;

            // Define explicit background and text colors for each severity
            let selectedClasses = "";
            if (isSelected) {
              switch (sev) {
                case "low":
                  selectedClasses =
                    "bg-green-500 text-white border-transparent";
                  break;
                case "medium":
                  selectedClasses =
                    "bg-amber-500 text-white border-transparent";
                  break;
                case "high":
                  selectedClasses = "bg-blue-600 text-white border-transparent";
                  break;
                case "critical":
                  selectedClasses = "bg-red-600 text-white border-transparent";
                  break;
              }
            }

            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={cn(
                  "py-3 px-2 rounded-lg border-2 transition-all text-sm font-semibold",
                  isSelected
                    ? selectedClasses
                    : "bg-secondary border-border hover:border-primary/50"
                )}
              >
                {t(`severityLevels.${sev}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Location */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {t("gpsLocation")}
        </Label>
        <div className="p-4 rounded-lg bg-secondary border border-border">
          {locationLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t("acquiring")}</span>
            </div>
          ) : locationError ? (
            <div className="space-y-2">
              <p className="text-destructive text-sm">{locationError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => getLocation()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : location ? (
            <div className="space-y-1">
              <p className="font-mono text-success">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("accuracy", {
                  accuracy: location.accuracyMeters.toFixed(0),
                })}
              </p>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => getLocation()}
            >
              Get Location
            </Button>
          )}
        </div>
      </div>

      {/* Manual Address (if GPS fails) */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {t("manualAddress")}
        </Label>
        <Input
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder={t("manualAddressPlaceholder")}
          className="bg-secondary border-border"
        />
        <p className="text-xs text-muted-foreground">
          {t("manualAddressHint")}
        </p>
      </div>

      {/* Timestamp */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          {t("timestamp")}
        </Label>
        <div className="p-4 rounded-lg bg-secondary border border-border">
          <p className="font-mono mb-3">{new Date().toLocaleString()}</p>
          <div className="flex items-center justify-between">
            <Label
              htmlFor="override-time"
              className="text-sm text-muted-foreground"
            >
              {t("overrideTimestamp")}
            </Label>
            <Switch
              id="override-time"
              checked={overrideTime}
              onCheckedChange={setOverrideTime}
            />
          </div>
          {overrideTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <Input
                type="datetime-local"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="bg-muted"
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">{t("description")}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          className="min-h-[100px] bg-secondary border-border resize-none"
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          {t("photo")}
        </Label>

        {!uploadedImage ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
              disabled={imageCompressing}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageCompressing}
              className="w-full p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {imageCompressing ? (
                <>
                  <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                  <span className="text-sm">Compressing image...</span>
                </>
              ) : (
                <>
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm">{t("capturePhoto")}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Optional - Max 10MB
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="relative rounded-lg overflow-hidden border-2 border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedImage}
              alt="Uploaded incident"
              className="w-full h-48 object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Image attached and compressed</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pb-4">
        <Button
          type="submit"
          size="lg"
          disabled={
            !incidentType ||
            !severity ||
            (!location && !manualAddress.trim()) ||
            submitting
          }
          className="w-full h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground glow-primary disabled:opacity-50 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            t("save")
          )}
        </Button>
      </div>
    </motion.form>
  );
};
