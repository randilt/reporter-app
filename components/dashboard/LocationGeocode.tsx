import {
  MapPin,
  Loader2,
  AlertCircle,
  Globe,
  Map as MapIcon,
} from "lucide-react";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { Button } from "@/components/ui/button";

interface LocationGeocodeProps {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  label: string;
  language?: "en" | "si";
  iconClassName?: string;
}

export function LocationGeocode({
  latitude,
  longitude,
  accuracyMeters,
  label,
  language = "en",
  iconClassName = "text-primary",
}: LocationGeocodeProps) {
  const { data, loading, error, refetch } = useReverseGeocode({
    latitude,
    longitude,
    localityLanguage: language,
    enabled: latitude !== 0 && longitude !== 0,
  });

  return (
    <div className="flex items-start gap-2">
      <MapPin className={`h-4 w-4 mt-0.5 ${iconClassName}`} />
      <div className="flex-1">
        <div className="text-xs text-slate-600 mb-1">{label}</div>

        {/* Coordinates */}
        <div className="font-mono text-sm mb-2">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
          <span className="text-slate-600 ml-2">±{accuracyMeters}m</span>
        </div>

        {/* Geocoded Information */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Loading location details...</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={refetch}
                className="h-6 px-2 mt-1 text-xs"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {data && !loading && !error && (
          <div className="space-y-2 text-sm">
            {/* Main Location Info */}
            <div className="bg-slate-50 rounded-md p-2 space-y-1">
              {data.city && (
                <div className="flex items-center gap-2">
                  <MapIcon className="h-3 w-3 text-slate-500" />
                  <span className="font-medium">{data.city}</span>
                </div>
              )}
              {data.principalSubdivision && (
                <div className="text-slate-600 text-xs pl-5">
                  {data.principalSubdivision}
                </div>
              )}
              {data.countryName && (
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-600">
                    {data.countryName} ({data.countryCode})
                  </span>
                </div>
              )}
              {data.plusCode && (
                <div className="text-slate-500 text-xs font-mono">
                  Plus Code: {data.plusCode}
                </div>
              )}
            </div>

            {/* Administrative Details */}
            {data.localityInfo?.administrative &&
              data.localityInfo.administrative.length > 0 && (
                <div className="border-t border-slate-200 pt-2">
                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    Administrative Regions:
                  </div>
                  <div className="space-y-1">
                    {data.localityInfo.administrative
                      .sort((a, b) => a.order - b.order)
                      .slice(0, 3)
                      .map((region, idx) => (
                        <div key={idx} className="text-xs text-slate-600 pl-2">
                          • {region.name}
                          {region.description &&
                            region.description !== region.name && (
                              <span className="text-slate-500">
                                {" "}
                                - {region.description}
                              </span>
                            )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Google Maps Link */}
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              <MapIcon className="h-3 w-3" />
              View on Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
