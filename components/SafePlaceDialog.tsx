"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useResponder } from "@/hooks/useResponder";
import { getDeviceInfo } from "@/lib/db";
import { toast } from "sonner";

interface SafePlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SafePlaceData {
  location: {
    lat: number;
    lng: number;
  } | null;
  address: string;
  amenities: {
    networkAccess: boolean;
    cleanWater: boolean;
    shelter: boolean;
    medicalAid: boolean;
    food: boolean;
    electricity: boolean;
  };
  description: string;
}

export function SafePlaceDialog({ open, onOpenChange }: SafePlaceDialogProps) {
  const { getLocation, loading: locationLoading } = useGeolocation();
  const { responder } = useResponder();
  const [formData, setFormData] = useState<SafePlaceData>({
    location: null,
    address: "",
    amenities: {
      networkAccess: false,
      cleanWater: false,
      shelter: false,
      medicalAid: false,
      food: false,
      electricity: false,
    },
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleGetCurrentLocation = async () => {
    try {
      const location = await getLocation();
      setFormData((prev) => ({
        ...prev,
        location: { lat: location.lat, lng: location.lng },
      }));
      toast.success("Location obtained", {
        description: `Lat: ${location.lat.toFixed(
          6
        )}, Lng: ${location.lng.toFixed(6)}`,
      });
    } catch (error) {
      toast.error("Failed to get location", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleAmenityToggle = (amenity: keyof SafePlaceData["amenities"]) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenity]: !prev.amenities[amenity],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.location && !formData.address) {
      toast.error("Location required", {
        description:
          "Please either get your current location or enter an address",
      });
      return;
    }

    if (!responder) {
      toast.error("Profile required", {
        description: "Please complete your profile before marking safe places",
      });
      return;
    }

    setSubmitting(true);
    try {
      const deviceInfo = getDeviceInfo();
      const now = new Date();
      const localId = crypto.randomUUID();

      const safePlaceData = {
        localId,
        location: formData.location,
        address: formData.address,
        amenities: formData.amenities,
        description: formData.description,
        // Responder information
        responderId: responder.responderId,
        responderName: responder.name,
        responderPhone: responder.phone,
        // Timestamp and timezone information
        createdAtLocal: now.toISOString(),
        deviceTime: now.toISOString(),
        deviceTimezone: deviceInfo.deviceTimezone,
        timezoneOffsetMinutes: deviceInfo.timezoneOffsetMinutes,
        // Device information
        deviceId: deviceInfo.deviceId,
        appVersion: deviceInfo.appVersion,
      };

      // TODO: Send to API in realtime
      console.log("Safe place data with metadata:", safePlaceData);

      toast.success("Safe place marked!", {
        description: "Thank you for helping others stay safe.",
      });

      // Reset form
      setFormData({
        location: null,
        address: "",
        amenities: {
          networkAccess: false,
          cleanWater: false,
          shelter: false,
          medicalAid: false,
          food: false,
          electricity: false,
        },
        description: "",
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to mark safe place", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DrawerTitle>Mark Safe Place</DrawerTitle>
              <DrawerDescription>
                Help others find safe locations
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto">
          {/* Location Section */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Location</Label>
              <p className="text-sm text-muted-foreground">
                Choose current location or enter an address
              </p>

              <Button
                onClick={handleGetCurrentLocation}
                disabled={locationLoading}
                variant="outline"
                className="w-full"
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </Button>

              {formData.location && (
                <div className="text-sm text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-950/30 rounded">
                  ✓ Location obtained: {formData.location.lat.toFixed(6)},{" "}
                  {formData.location.lng.toFixed(6)}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">Or Enter Address</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Main St, City"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Amenities Checklist */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">
                  Available Amenities
                </Label>
                <p className="text-sm text-muted-foreground">
                  Check all that apply
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { key: "networkAccess", label: "Network/Internet Access" },
                  { key: "cleanWater", label: "Access to Clean Water" },
                  { key: "shelter", label: "Shelter Available" },
                  { key: "medicalAid", label: "Medical Aid/First Aid" },
                  { key: "food", label: "Food Supply" },
                  { key: "electricity", label: "Electricity" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        formData.amenities[
                          key as keyof SafePlaceData["amenities"]
                        ]
                      }
                      onChange={() =>
                        handleAmenityToggle(
                          key as keyof SafePlaceData["amenities"]
                        )
                      }
                      className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Additional Information (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Any additional details about this safe place..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Mark as Safe"
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
