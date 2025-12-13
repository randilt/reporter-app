"use client";
import React, { useRef, useState, useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiReports } from "@/hooks/useApiReports";
import "leaflet/dist/leaflet.css";
import { X } from "lucide-react";
import { format } from "date-fns";

const severityColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
};

type Point = {
  id: string;
  lat: number;
  lng: number;
  severity: string;
  incidentType: string;
  createdAtLocal: string;
  reporterName: string;
  address?: string;
  description?: string;
  phone?: string;
  images?: string[];
};

export default function MapFullscreen() {
  const { reports: apiReports = [] } = useApiReports();
  const mapRef = useRef<LeafletMap | null>(null);
  const [selected, setSelected] = useState<Point | null>(null);
  const didAutoSelect = useRef(false);

  // Add custom CSS for pulsing rings
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes pulse-ring {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
      .pulse-ring {
        animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const points: Point[] = apiReports
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
      // Prefer city + province, else address, else unknown
      let address = "Unknown location";
      if (r.city && r.province) {
        address = `${r.city}, ${r.province}`;
      } else if (r.city) {
        address = r.city;
      } else if (report.location?.address) {
        address = report.location.address;
      }
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

  // Auto-select the first incident on initial mount only
  useEffect(() => {
    if (!didAutoSelect.current && points.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(points[0]);
      didAutoSelect.current = true;
    }
  }, [points]);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;
    try {
      if (points.length === 1) {
        mapRef.current.setView([points[0].lat, points[0].lng], 13);
      } else {
        const bounds = points.map((p) => [p.lat as number, p.lng as number]);
        mapRef.current.fitBounds(bounds as unknown as [[number, number]], {
          padding: [60, 60],
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

  const selectedSeverityColor = selected
    ? severityColor[selected.severity] || "#7c3aed"
    : "#7c3aed";

  return (
    <div className="relative w-full h-screen bg-slate-50">
      {/* Map fills the viewport */}
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", zIndex: 49 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p) => (
          <CircleMarker
            key={p.id}
            className="animate-pulse"
            center={[p.lat as number, p.lng as number]}
            radius={8}
            pathOptions={{
              color: severityColor[p.severity] || "#7c3aed",
              fillColor: severityColor[p.severity] || "#7c3aed",
              fillOpacity: 0.9,
              weight: 2,
            }}
            eventHandlers={{
              click: () => {
                setSelected(p);
                try {
                  mapRef.current?.setView(
                    [p.lat as number, p.lng as number],
                    14
                  );
                } catch {
                  // ignore
                }
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-sm">
                <div className="font-semibold">
                  {p.incidentType.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600">{p.reporterName}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Right detail panel */}
      <aside
        className={`fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-xl transition-transform duration-300 overflow-auto ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!selected}
      >
        <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{selected?.incidentType}</h2>
            <div className="text-xs text-slate-500">
              {selected?.reporterName}
            </div>
          </div>
          <button
            onClick={() => setSelected(null)}
            aria-label="Close details"
            className="p-2 rounded hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {selected?.images && selected.images.length > 0 && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.images[0]}
                alt="Incident"
                className="w-full h-56 object-cover rounded border border-slate-200"
              />
              {selected.images.length > 1 && (
                <div className="text-xs text-slate-500 mt-2">
                  +{selected.images.length - 1} more image(s)
                </div>
              )}
            </div>
          )}
          <div>
            {/* Show 0th image if present, else show placeholder */}
            {selected?.images && selected.images.length > 0 ? (
              <img
                src={selected.images[0]}
                alt="Incident"
                className="w-full h-56 object-cover rounded border border-slate-200"
              />
            ) : (
              <div className="w-full h-56 flex items-center justify-center bg-slate-100 rounded border border-slate-200">
                <svg
                  width="64"
                  height="64"
                  fill="none"
                  viewBox="0 0 64 64"
                  className="text-slate-300"
                >
                  <rect width="64" height="64" rx="12" fill="currentColor" />
                  <path d="M20 44l8-10 8 10h8V20H12v24h8z" fill="#e5e7eb" />
                  <circle cx="24" cy="28" r="4" fill="#cbd5e1" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-slate-800 mb-1">Description</h3>
            <p className="text-sm text-slate-600">
              {selected?.description || "—"}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-slate-800 mb-1">Details</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <div>
                <span className="font-medium">Severity: </span>
                <span
                  className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold uppercase"
                  style={{ backgroundColor: selectedSeverityColor }}
                >
                  {selected?.severity}
                </span>
              </div>
              <div>
                <span className="font-medium">Time: </span>
                <span className="text-slate-600 text-xs">
                  {selected
                    ? format(
                        new Date(selected.createdAtLocal),
                        "MMM d, yyyy HH:mm"
                      )
                    : "—"}
                </span>
              </div>
              <div>
                <span className="font-medium">Location: </span>
                <div className="text-xs text-slate-600">
                  {selected?.address && selected.address !== "Unknown location"
                    ? selected.address
                    : "—"}
                </div>
              </div>
              {selected?.phone && (
                <div>
                  <span className="font-medium">Phone: </span>
                  <span className="font-mono text-xs text-slate-600">
                    {selected.phone}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <a
              className="text-sm text-primary hover:underline"
              href={`https://www.google.com/maps?q=${selected?.lat},${selected?.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              View Directions on Google Maps
            </a>
          </div>
        </div>

        {/* Back to Home button at the bottom */}
        <div className="sticky bottom-0 bg-white p-4 border-t flex justify-center z-10">
          <Link href="/dashboard" className="w-full">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 justify-center"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
