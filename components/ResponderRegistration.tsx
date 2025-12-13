"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { saveResponderProfile } from "@/lib/db";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ResponderRegistrationProps {
  onRegistrationComplete: () => void;
}

export function ResponderRegistration({
  onRegistrationComplete,
}: ResponderRegistrationProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    nic: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useTranslations("ResponderRegistration");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/[\s-]/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.nic && formData.nic.length < 5) {
      newErrors.nic = "Please enter a valid NIC";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("validationError"), {
        description: t("fixErrors"),
      });
      return;
    }

    setLoading(true);

    try {
      const profile = await saveResponderProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        nic: formData.nic.trim() || undefined,
      });

      console.log("[RESPONDER] Profile created:", profile.responderId);

      toast.success(t("registrationSuccess"), {
        description: t("welcomeMessage", { name: profile.name }),
      });

      onRegistrationComplete();
    } catch (error) {
      console.error("[RESPONDER] Registration failed:", error);
      toast.error(t("registrationFailed"), {
        description: t("registrationFailedDesc"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t("nameLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder={t("namePlaceholder")}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
              required
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              {t("phoneLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("phonePlaceholder")}
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={errors.phone ? "border-destructive" : ""}
              required
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">
              {t("emailLabel")}{" "}
              <span className="text-muted-foreground">({t("optional")})</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* NIC (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="nic">
              {t("nicLabel")}{" "}
              <span className="text-muted-foreground">({t("optional")})</span>
            </Label>
            <Input
              id="nic"
              type="text"
              placeholder={t("nicPlaceholder")}
              value={formData.nic}
              onChange={(e) => handleChange("nic", e.target.value)}
              className={errors.nic ? "border-destructive" : ""}
            />
            {errors.nic && (
              <p className="text-sm text-destructive">{errors.nic}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("saving") : t("submitButton")}
          </Button>
        </form>

        <div className="rounded-lg border border-muted bg-muted/20 p-4">
          <h3 className="mb-2 font-semibold">🔒 {t("privacyTitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("privacyNotice")}</p>
        </div>
      </div>
    </div>
  );
}
