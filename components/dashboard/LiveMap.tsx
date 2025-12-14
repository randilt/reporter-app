"use client";
import React, { useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
} from "react-leaflet";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
// import type { Report } from "@/lib/db/types";

type Report = {
  localId?: string;
  id?: string;
  locationCapturedAtCreation?: { lat: number; lng: number };
  incidentType?: string;
  createdAtLocal?: string;
  severity?: string | number;
  description?: string;
  images?: string[];
  location?: {
    latitude?: number;
    longitude?: number;
    lat?: number;
    lng?: number;
    address?: string;
  };
  reporter?: {
    name?: string;
    phone?: string;
  };
  reporterName?: string;
  responderName?: string;
  responderPhone?: string;
  createdByUser?: string;
  type?: string;
};

const severityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
};

interface LiveMapProps {
  reports: Report[];
}

export default function LiveMap({ reports }: LiveMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);

  const points = reports
    .map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const report = r as any;
      const lat =
        r.locationCapturedAtCreation?.lat ??
        report.location?.latitude ??
        report.location?.lat;
      const lng =
        r.locationCapturedAtCreation?.lng ??
        report.location?.longitude ??
        report.location?.lng;
      const reporterName =
        report.reporter?.name ??
        report.reporterName ??
        report.responderName ??
        (report.createdByUser
          ? `Reporter ${new Date(report.createdByUser).toLocaleString()}`
          : r.localId);
      const incidentType = r.incidentType ?? report.type ?? "Unknown";
      const createdAtLocal =
        r.createdAtLocal ?? report.createdByUser ?? new Date().toISOString();
      const severity = r.severity?.toString().toLowerCase() ?? "medium";
      const address = report.location?.address ?? "Unknown location";
      const description = r.description ?? "";
      const phone = report.reporter?.phone ?? report.responderPhone ?? "";
      const images = r.images ?? report.images ?? [];

      return {
        id: r.localId ?? report.id,
        lat,
        lng,
        severity,
        incidentType,
        createdAtLocal,
        reporterName,
        address,
        description,
        phone,
        images,
      };
    })
    .filter(
      (p) =>
        p.lat !== undefined &&
        p.lng !== undefined &&
        p.lat !== null &&
        p.lng !== null
    );

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;
    try {
      if (points.length === 1) {
        mapRef.current.setView([points[0].lat, points[0].lng], 13);
      } else {
        const bounds = points.map((p) => [p.lat as number, p.lng as number]);
        mapRef.current.fitBounds(bounds as unknown as [[number, number]], {
          padding: [50, 50],
        });
      }
    } catch {
      // ignore
    }
  }, [points]);

  const center: [number, number] =
    points.length > 0
      ? [points[0].lat as number, points[0].lng as number]
      : [6.6828, 80.399];

  return (
    <div className="relative h-[60vh] rounded-xl overflow-hidden">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat as number, p.lng as number]}
            radius={8}
            pathOptions={{
              color: severityColor[p.severity] || "#7c3aed",
              fillColor: severityColor[p.severity] || "#7c3aed",
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-sm">
                {p.images && p.images.length > 0 && (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt="Incident preview"
                      className="w-32 h-20 object-cover rounded border border-gray-300"
                    />
                  </div>
                )}
                <div className="font-semibold">
                  {p.incidentType.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600">{p.reporterName}</div>
              </div>
            </Tooltip>
            <Popup maxWidth={300}>
              <div className="text-sm space-y-2 p-1">
                <div className="font-bold text-base border-b pb-1">
                  {p.incidentType.toUpperCase()}
                </div>

                {p.images && p.images.length > 0 && (
                  <div className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt="Incident"
                      className="w-full h-32 object-cover rounded border border-gray-300"
                    />
                    {p.images.length > 1 && (
                      <div className="text-xs text-gray-600 text-center">
                        +{p.images.length - 1} more image(s)
                      </div>
                    )}
                  </div>
                )}

                {p.description && (
                  <div className="text-gray-700 text-xs leading-relaxed">
                    {p.description}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-800">Reporter:</span>
                    <span className="text-gray-700">{p.reporterName}</span>
                  </div>

                  {p.phone && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-800">Phone:</span>
                      <span className="text-gray-700 font-mono text-xs">
                        {p.phone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">Severity:</span>
                    <span
                      className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold uppercase"
                      style={{
                        backgroundColor: severityColor[p.severity] || "#7c3aed",
                      }}
                    >
                      {p.severity}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="font-medium text-gray-800">Location:</span>
                    <span className="text-gray-600 text-xs">{p.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">Time:</span>
                    <span className="text-gray-600 text-xs">
                      {format(new Date(p.createdAtLocal), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div
        role="region"
        aria-label="Severity legend"
        className="absolute top-4 right-4 z-10000 bg-white/95 border border-slate-300 rounded-lg p-3 shadow-lg pointer-events-auto backdrop-blur-sm"
        style={{ maxWidth: 220 }}
      >
        <div className="text-xs font-bold mb-2 text-gray-800">
          SEVERITY LEGEND
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: severityColor.critical,
                border: `2px solid ${severityColor.critical}`,
              }}
            />
            <span className="font-medium">Critical</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: severityColor.high,
                border: `2px solid ${severityColor.high}`,
              }}
            />
            <span className="font-medium">High</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: severityColor.medium,
                border: `2px solid ${severityColor.medium}`,
              }}
            />
            <span className="font-medium">Medium</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: severityColor.low,
                border: `2px solid ${severityColor.low}`,
              }}
            />
            <span className="font-medium">Low</span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <span className="font-semibold">{points.length}</span> incidents
            shown
          </div>
        </div>
      </div>
    </div>
  );
}
