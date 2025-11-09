'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { HandHeart } from 'lucide-react';
import React from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import { enqueue } from '@/lib/offline-queue';
import { useGeolocation } from '@/hooks/use-geolocation';

// Validate Nepal phone numbers in E.164 format: +977 ...
// - Mobile: +977 97/98/96XXXXXXXX (10 digits after leading 9)
// - Landline: +977 1XXXXXXX or +977 [2-9]XXXXXXX (8 digits total)
const isValidNepalPhone = (value: string) => {
  const clean = value.trim().replace(/[\s()-]/g, '');
  const mobile = /^\+977(?:97|98|96)\d{8}$/; // e.g., +9779801234567
  const landline = /^\+977(?:1\d{7}|[2-9]\d{7})$/; // e.g., +9771XXXXXXX or +97756XXXXXXX
  return mobile.test(clean) || landline.test(clean);
};

// Format helper: keep it user-friendly as they type and on blur
const stripToNepalDigits = (value: string) => value.replace(/[^\d+]/g, '');
const ensurePrefix = (value: string) => (value.startsWith('+977') ? value : `+977${value.startsWith('+') ? value.replace(/^\+/, '') : value}`);

const formatNepalPhonePartial = (value: string) => {
  // Allow users to type; enforce +977 and space-grouping gradually
  let v = stripToNepalDigits(value);
  v = ensurePrefix(v);
  // Separate prefix and rest digits
  const rest = v.replace(/^\+977/, '');
  const digits = rest.replace(/\D/g, '').slice(0, 10); // max 10 for mobiles; landlines have 8
  if (!digits) return '+977 ';

  // Decide pattern
  if (digits.startsWith('9')) {
    // Mobile: 9XX XXX XXXX (total 10)
    const p1 = digits.slice(0, 3);
    const p2 = digits.slice(3, 6);
    const p3 = digits.slice(6, 10);
    return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
  }
  if (digits.startsWith('1')) {
    // Kathmandu landline: 1 XXX XXXX (total 8)
    const p1 = digits.slice(0, 1);
    const p2 = digits.slice(1, 4);
    const p3 = digits.slice(4, 8);
    return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
  }
  // Other landlines: NN XXX XXX (total 8)
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 8);
  return `+977 ${p1}${p2 ? ' ' + p2 : ''}${p3 ? ' ' + p3 : ''}`.trimEnd();
};

const formatNepalPhoneFinal = (value: string) => {
  // On blur: normalize spacing to canonical groups
  return formatNepalPhonePartial(value);
};

const pledgeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  contact: z.string().email("Please enter a valid email address."),
  contactNumber: z
    .string()
    .min(7, "Contact number is required.")
    .refine(
      (val) => isValidNepalPhone(val),
      "Enter a Nepali number in +977 format (e.g., +977 980 123 4567)."
    ),
  resourceType: z.enum(['Food', 'Shelter', 'Transport', 'Skills']),
  resourceDetails: z.string().min(5, "Please provide more details."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  locationLandmark: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationAccuracy: z.number().optional(),
});

type PledgeFormValues = z.infer<typeof pledgeSchema>;

export default function PledgeForm() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [locLoading, setLocLoading] = React.useState(false);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = React.useState(false);
  const [lastUpdateTs, setLastUpdateTs] = React.useState<number | null>(null);
  const { toast } = useToast();
  const { position, watching, startWatching, stopWatching } = useGeolocation();
  const lastGeocodeRef = React.useRef<{ lat: number; lon: number } | null>(null);

  const form = useForm<PledgeFormValues>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      name: "",
      contact: "",
      contactNumber: "",
      resourceDetails: "",
      quantity: 1,
      locationLandmark: "",
      latitude: undefined,
      longitude: undefined,
      locationAccuracy: undefined,
    }
  });

  const onSubmit = async (data: PledgeFormValues) => {
    const payload: any = {
      name: data.name,
      contact: data.contact,
      contact_number: data.contactNumber,
      resource_type: data.resourceType,
      resource_details: data.resourceDetails,
      quantity: data.quantity,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      location_accuracy: data.locationAccuracy ?? null,
      location_landmark: data.locationLandmark ?? null,
    };

    try {
      const offlineMode = !isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine);
      if (offlineMode) {
        enqueue({ type: 'pledge', payload });
        toast({ title: 'Saved offline', description: 'Your pledge will sync when you are back online.' });
        setIsSubmitted(true);
        return;
      }

      const supabase = getSupabaseClient();
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user?.id) {
        payload.pledger_id = authUser.user.id;
      }
      const { error } = await supabase.from('pledges').insert(payload);
      if (error) throw error;

      toast({
        title: 'Pledge Received!',
        description: 'Thank you for your contribution to community resilience.',
      });
      setIsSubmitted(true);
    } catch (e: any) {
      console.error('Failed to submit pledge:', e);
      // Network or configuration issues: queue offline
      enqueue({ type: 'pledge', payload });
      toast({ title: 'Saved offline', description: 'We queued your pledge to sync later.' });
      setIsSubmitted(true);
    }
  };

  const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
      const resp = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return typeof data?.display_name === 'string' ? data.display_name : null;
    } catch (e) {
      return null;
    }
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'Location not supported', description: 'Your browser does not support geolocation.' });
      return;
    }
    setLocLoading(true);
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        form.setValue('latitude', latitude);
        form.setValue('longitude', longitude);
        form.setValue('locationAccuracy', accuracy ?? undefined);
        try {
          localStorage.setItem('lastPledgeGeo', JSON.stringify({ latitude, longitude }));
        } catch {}
        let label = `Lat ${latitude.toFixed(5)}, Lon ${longitude.toFixed(5)}${accuracy ? ` (~${Math.round(accuracy)}m)` : ''}`;
        const pretty = await reverseGeocode(latitude, longitude);
        if (pretty) label = pretty;
        const current = form.getValues('locationLandmark');
        // If empty or previously auto-filled, replace; otherwise append
        if (!current || current.startsWith('Lat ') || current.includes('~m)')) {
          form.setValue('locationLandmark', label);
        } else {
          form.setValue('locationLandmark', `${current} | ${label}`);
        }
        toast({ title: 'Location captured', description: 'We added your current location to the pledge.' });
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        toast({ title: 'Unable to get location', description: err.message || 'Please try again or enter a landmark manually.' });
      },
      opts
    );
  };

  // Live tracking: update form values when geolocation updates
  React.useEffect(() => {
    if (!liveTrackingEnabled) return;
    if (position) {
      form.setValue('latitude', position.latitude);
      form.setValue('longitude', position.longitude);
      form.setValue('locationAccuracy', position.accuracy ?? undefined);
      try { localStorage.setItem('lastPledgeGeo', JSON.stringify({ latitude: position.latitude, longitude: position.longitude })); } catch {}
      setLastUpdateTs(Date.now());
    }
  }, [position, liveTrackingEnabled]);

  React.useEffect(() => {
    if (liveTrackingEnabled && !watching) startWatching();
    if (!liveTrackingEnabled && watching) stopWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTrackingEnabled]);

  // Periodic reverse geocoding while tracking to keep landmark fresh
  React.useEffect(() => {
    if (!liveTrackingEnabled) return;
    const intervalMs = 45000; // 45 seconds
    const id = setInterval(async () => {
      const lat = form.getValues('latitude');
      const lon = form.getValues('longitude');
      if (typeof lat !== 'number' || typeof lon !== 'number') return;
      const prev = lastGeocodeRef.current;
      const delta = prev ? Math.abs(prev.lat - lat) + Math.abs(prev.lon - lon) : Infinity;
      if (delta < 0.00005) return; // ~5-6 meters threshold
      const pretty = await reverseGeocode(lat, lon);
      if (pretty) {
        const current = form.getValues('locationLandmark');
        if (!current || current.startsWith('Lat ') || current.includes('~m)')) {
          form.setValue('locationLandmark', pretty);
        }
        lastGeocodeRef.current = { lat, lon };
      }
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTrackingEnabled]);
  
  if (isSubmitted) {
    return (
        <div className="text-center p-12 bg-green-50 rounded-lg border border-green-200">
            <HandHeart className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-4 text-2xl font-bold text-green-800">Thank You!</h3>
            <p className="mt-2 text-green-700">Your pledge has been added to the network. You will be contacted if a match is found for your resources.</p>
            <Button onClick={() => {
                setIsSubmitted(false);
                form.reset();
                }} className="mt-6">Pledge Something Else</Button>
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Your Name / Organization</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Jane Doe or Community Cafe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                    <Input
                      type="tel"
                      inputMode="tel"
                      aria-label="Contact Number"
                      placeholder="e.g., +977 980 123 4567"
                      value={field.value}
                      onChange={(e) => field.onChange(formatNepalPhonePartial(e.target.value))}
                      onBlur={() => field.onChange(formatNepalPhoneFinal(field.value))}
                      onFocus={() => {
                        if (!field.value) field.onChange('+977 ');
                      }}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
            control={form.control}
            name="resourceType"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Resource Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Select a resource category" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Shelter">Shelter</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Skills">Skills</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
            control={form.control}
            name="resourceDetails"
            render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Resource Details</FormLabel>
                <FormControl>
                    <Textarea placeholder="e.g., 'Hot meals', 'Beds in a spare room', 'Paramedic skills'" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                    <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="locationLandmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Nearby Landmark (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Kupondole Bridge, Ward 5 Community Center, Patan Hospital" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Button type="button" className="w-full sm:w-auto" variant="secondary" onClick={handleUseCurrentLocation} disabled={locLoading}>
            {locLoading ? 'Locating…' : 'Use current location'}
          </Button>
          {form.watch('latitude') && form.watch('longitude') && (
            <span className="text-sm text-muted-foreground sm:ml-2">
              {`Lat ${Number(form.watch('latitude')).toFixed(5)}, Lon ${Number(form.watch('longitude')).toFixed(5)}${form.watch('locationAccuracy') ? ` (~${Math.round(Number(form.watch('locationAccuracy')))}m)` : ''}`}
            </span>
          )}
        </div>

        {/* Live location toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input className="h-5 w-5" type="checkbox" checked={liveTrackingEnabled} onChange={(e) => setLiveTrackingEnabled(e.target.checked)} />
            <span>Live location (auto-update)</span>
          </label>
          {liveTrackingEnabled && (
            <span className="text-xs text-muted-foreground sm:ml-2">{position ? `Tracking: ~${Math.round(Number(position.accuracy ?? 0))}m • Updated ${lastUpdateTs ? new Date(lastUpdateTs).toLocaleTimeString() : '—'}` : 'Starting...'}</span>
          )}
        </div>

        <div className="flex justify-end">
            <Button type="submit" size="lg">
                <HandHeart className="mr-2 h-4 w-4" />
                Submit Pledge
            </Button>
        </div>

      </form>
    </Form>
  );
}
