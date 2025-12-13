"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  Wifi,
  Droplet,
  Home,
  Heart,
  Apple,
  Zap,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

interface SafePlace {
  PK: string;
  localId: string;
  responderName: string;
  responderId: string;
  responderPhone: string;
  location: {
    lat: number;
    lng: number;
  };
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
  status: string;
  createdAtLocal: string;
  deviceTime: string;
  deviceTimezone: string;
  timezoneOffsetMinutes: number;
  deviceId: string;
  appVersion: string;
}

interface SafePlacesResponse {
  data: SafePlace[];
}

const AmenityIcon = ({
  amenity,
  available,
}: {
  amenity: keyof SafePlace["amenities"];
  available: boolean;
}) => {
  const icons = {
    networkAccess: Wifi,
    cleanWater: Droplet,
    shelter: Home,
    medicalAid: Heart,
    food: Apple,
    electricity: Zap,
  };

  const labels = {
    networkAccess: "Network",
    cleanWater: "Water",
    shelter: "Shelter",
    medicalAid: "Medical",
    food: "Food",
    electricity: "Power",
  };

  const Icon = icons[amenity];

  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        available
          ? "text-green-600 dark:text-green-400"
          : "text-gray-300 dark:text-gray-700"
      }`}
      title={`${labels[amenity]}: ${available ? "Available" : "Not Available"}`}
    >
      <Icon className="h-4 w-4" />
      <span className="text-xs">{labels[amenity]}</span>
    </div>
  );
};

export default function SafePlacesView() {
  const [safePlaces, setSafePlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, string>
  >({});
  const [updatingStatuses, setUpdatingStatuses] = useState<
    Record<string, boolean>
  >({});
  const [sortField, setSortField] =
    useState<"createdAtLocal">("createdAtLocal");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchSafePlaces();
  }, []);

  const fetchSafePlaces = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/safe-places");

      if (!response.ok) {
        throw new Error("Failed to fetch safe places");
      }

      const data: SafePlacesResponse = await response.json();
      setSafePlaces(data.data || []);
    } catch (error) {
      console.error("Error fetching safe places:", error);
      toast.error("Failed to load safe places", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: "createdAtLocal") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPlaces = [...safePlaces].sort((a, b) => {
    const aValue = new Date(a[sortField]).getTime();
    const bValue = new Date(b[sortField]).getTime();

    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const updateStatus = async (pk: string, newStatus: string) => {
    const prev = safePlaces.find((p) => p.PK === pk)?.status;
    // optimistic update
    setSafePlaces((prevPlaces) =>
      prevPlaces.map((p) => (p.PK === pk ? { ...p, status: newStatus } : p))
    );
    setUpdatingStatuses((s) => ({ ...s, [pk]: true }));

    try {
      const res = await fetch(
        `/api/safe-places/update?status=${encodeURIComponent(
          newStatus
        )}&id=${encodeURIComponent(pk)}`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const json = await res.json();
      toast.success("Status updated", { description: json?.message || "" });
    } catch (err) {
      console.error("Error updating status:", err);
      // revert optimistic update
      setSafePlaces((prevPlaces) =>
        prevPlaces.map((p) =>
          p.PK === pk ? { ...p, status: prev ?? p.status } : p
        )
      );
      toast.error("Failed to update status", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setUpdatingStatuses((s) => ({ ...s, [pk]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">
          Loading safe places...
        </div>
      </div>
    );
  }

  if (safePlaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <MapPin className="h-12 w-12 text-muted-foreground" />
        <div className="text-lg text-muted-foreground">
          No safe places marked yet
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Safe Places ({safePlaces.length})
        </h2>
        <Button onClick={fetchSafePlaces} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort("createdAtLocal")}
              >
                Reported At
                {sortField === "createdAtLocal" &&
                  (sortDirection === "asc" ? (
                    <ChevronUp className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 inline ml-1" />
                  ))}
              </TableHead>
              <TableHead>Responder</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Amenities</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlaces.map((place) => (
              <>
                <TableRow
                  key={place.PK}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleRow(place.PK)}
                >
                  <TableCell>
                    {expandedRow === place.PK ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(place.createdAtLocal),
                      "MMM dd, yyyy HH:mm"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{place.responderName}</span>
                      <span className="text-sm text-muted-foreground">
                        {place.responderPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-xs">
                      <span className="text-sm">
                        {place.address ||
                          `${place.location.lat.toFixed(
                            6
                          )}, ${place.location.lng.toFixed(6)}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      {Object.entries(place.amenities)
                        .filter(([, available]) => available)
                        .slice(0, 3)
                        .map(([amenity]) => (
                          <AmenityIcon
                            key={amenity}
                            amenity={amenity as keyof SafePlace["amenities"]}
                            available={true}
                          />
                        ))}
                      {Object.values(place.amenities).filter(Boolean).length >
                        3 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +
                          {Object.values(place.amenities).filter(Boolean)
                            .length - 3}{" "}
                          more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        place.status === "waiting"
                          ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"
                          : place.status === "verified"
                          ? "bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {place.status}
                    </span>
                  </TableCell>
                </TableRow>

                {expandedRow === place.PK && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30">
                      <div className="p-4 space-y-4">
                        {/* All Amenities */}
                        <div>
                          <h4 className="font-semibold mb-3">
                            Available Amenities
                          </h4>
                          <div className="grid grid-cols-6 gap-4">
                            {Object.entries(place.amenities).map(
                              ([amenity, available]) => (
                                <AmenityIcon
                                  key={amenity}
                                  amenity={
                                    amenity as keyof SafePlace["amenities"]
                                  }
                                  available={available}
                                />
                              )
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {place.description && (
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {place.description}
                            </p>
                          </div>
                        )}

                        {/* Location Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold mb-2">Location</h4>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">
                                  Coordinates:
                                </span>{" "}
                                {place.location.lat.toFixed(6)},{" "}
                                {place.location.lng.toFixed(6)}
                              </p>
                              {place.address && (
                                <p>
                                  <span className="text-muted-foreground">
                                    Address:
                                  </span>{" "}
                                  {place.address}
                                </p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">Contact</h4>
                            <div className="space-y-1 text-sm">
                              <p className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {place.responderName}
                              </p>
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {place.responderPhone}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div>
                          <h4 className="font-semibold mb-2">Metadata</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <p>
                              <span className="font-medium">Device ID:</span>{" "}
                              {place.deviceId.slice(0, 8)}...
                            </p>
                            <p>
                              <span className="font-medium">App Version:</span>{" "}
                              {place.appVersion}
                            </p>
                            <p>
                              <span className="font-medium">Timezone:</span>{" "}
                              {place.deviceTimezone}
                            </p>
                          </div>
                        </div>
                        {/* Admin Controls: status change */}
                        <div>
                          <h4 className="font-semibold mb-2">Admin</h4>
                          <div className="flex items-center gap-3">
                            <Select
                              value={selectedStatuses[place.PK] ?? place.status}
                              onValueChange={(v) =>
                                setSelectedStatuses((s) => ({
                                  ...s,
                                  [place.PK]: v,
                                }))
                              }
                            >
                              <SelectTrigger size="sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="waiting">Waiting</SelectItem>
                                <SelectItem value="verified">
                                  Verified
                                </SelectItem>
                                <SelectItem value="rejected">
                                  Rejected
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <Button
                              size="sm"
                              onClick={() =>
                                updateStatus(
                                  place.PK,
                                  selectedStatuses[place.PK] ?? place.status
                                )
                              }
                              disabled={!!updatingStatuses[place.PK]}
                            >
                              {updatingStatuses[place.PK]
                                ? "Updating..."
                                : "Update Status"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
