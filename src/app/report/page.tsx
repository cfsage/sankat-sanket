'use client';

import { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, MapPin } from 'lucide-react';
import MapPicker from '@/components/report/map-picker';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import CameraCapture from '@/components/dashboard/camera-capture';

const incidentTypeOptions = ['Flood', 'Fire', 'Storm', 'Earthquake', 'Landslide', 'Other'] as const;

export default function ReportPage() {
  const { toast } = useToast();
  const supabaseReady = isSupabaseConfigured();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [incidentType, setIncidentType] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      const file = accepted[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }, []);

  const dropzone = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
    onDrop,
  });

  const isReady = useMemo(() => {
    return Boolean(photoFile && incidentType && coords.latitude !== null && coords.longitude !== null);
  }, [photoFile, incidentType, coords]);

  const handleUploadToStorage = async (file: File) => {
    if (!supabaseReady) throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    const supabase = getSupabaseClient();
    const bucket = 'incident-photos';
    const path = `reports/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!isReady || !photoFile || !incidentType || coords.latitude == null || coords.longitude == null) return;
    try {
      setSubmitting(true);
      const photoUrl = await handleUploadToStorage(photoFile);
      const { error } = await supabase.from('incidents').insert({
        status: 'unverified',
        type: incidentType,
        description,
        photo_url: photoUrl,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (error) throw error;
      toast({ title: 'Report submitted', description: 'Your incident was sent for verification.' });
      // reset
      setPhotoFile(null);
      setPhotoPreview(null);
      setIncidentType(undefined);
      setDescription('');
      setCoords({ latitude: null, longitude: null });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Submit failed', description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Public Incident Report</h1>

      {!supabaseReady && (
        <div className="rounded-md border bg-muted/30 p-4 text-sm">
          Supabase is not configured. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.
        </div>
      )}

      {/* Photo uploader */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Photo</label>
        <div
          {...dropzone.getRootProps({ className: 'border-dashed border rounded-lg p-6 text-center cursor-pointer' })}
        >
          <input {...dropzone.getInputProps()} />
          {photoPreview ? (
            <Image src={photoPreview} alt="preview" width={640} height={480} className="mx-auto rounded" />
          ) : (
            <p>Drag & drop or click to select an image.</p>
          )}
        </div>
        <div className="text-xs text-muted-foreground">Alternatively, use the camera:</div>
        <CameraCapture
          onCapture={(file) => {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
          }}
        />
      </section>

      {/* Description */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Description (optional)</label>
        <Textarea
          placeholder="Describe the situation and needs."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </section>

      {/* Type */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Incident Type</label>
        <Select onValueChange={(v) => setIncidentType(v)} value={incidentType}>
          <SelectTrigger>
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            {incidentTypeOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Coordinates via geolocation + map click */}
      <section className="space-y-3">
        <label className="text-sm font-medium">Location</label>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {coords.latitude && coords.longitude ? (
            <span>Lat {coords.latitude.toFixed(6)}, Lng {coords.longitude.toFixed(6)}</span>
          ) : (
            <span>Click on map or use geolocation to set coordinates.</span>
          )}
        </div>
        <MapPicker
          onChange={({ latitude, longitude }) => setCoords({ latitude, longitude })}
        />
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!isReady || submitting} size="lg">
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Submit Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}