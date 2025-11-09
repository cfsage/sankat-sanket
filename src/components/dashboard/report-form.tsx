'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { handleReportAnalysis } from '@/app/dashboard/report/actions';
import AnalysisResults from './analysis-results';
import { Loader2, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import CameraCapture from './camera-capture';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// incident type options
const incidentTypeOptions = ['Flood', 'Fire', 'Storm', 'Earthquake', 'Landslide', 'Other'] as const;

// utils
const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// schema
const reportSchema = z.object({
  photo: z.any().refine(file => file?.length === 1, "A photo is required."),
  audio: z.any().optional(),
  textDescription: z.string().optional(),
  incidentType: z.enum(incidentTypeOptions, {
    required_error: 'Please select an incident type.'
  }),
  latitude: z.number({ required_error: 'Location is required.' }),
  longitude: z.number({ required_error: 'Location is required.' }),
});

// types
type ReportFormValues = z.infer<typeof reportSchema>;
export type AnalysisResultData = Awaited<ReturnType<typeof handleReportAnalysis>>;

export default function ReportForm() {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error' | 'unsupported'>('idle');
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      incidentType: undefined,
      latitude: undefined,
      longitude: undefined,
    } as any,
  });

  // Compute submit readiness based on required fields
  const photoFileList = form.watch('photo');
  const incidentTypeVal = form.watch('incidentType');
  const latVal = form.watch('latitude');
  const lngVal = form.watch('longitude');
  const isReady = Boolean(
    photoFileList && photoFileList.length === 1 &&
    incidentTypeVal &&
    typeof latVal === 'number' && !Number.isNaN(latVal) &&
    typeof lngVal === 'number' && !Number.isNaN(lngVal)
  );

  // Manual geolocation fetch handler
  const fetchLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      toast({
        variant: 'destructive',
        title: 'Geolocation Not Supported',
        description: 'Your device does not support geolocation.'
      });
      return;
    }

    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue('latitude', pos.coords.latitude);
        form.setValue('longitude', pos.coords.longitude);
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: 'Unable to retrieve your current location.'
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (data: ReportFormValues) => {
    setIsSubmitting(true);
    setAnalysisResult(null);

    try {
      const photoFile = data.photo[0] as File;
      const photoDataUri = await fileToDataUri(photoFile);

      let audioDataUri: string | undefined = undefined;
      if (data.audio && data.audio.length > 0) {
        const audioFile = data.audio[0] as File;
        audioDataUri = await fileToDataUri(audioFile);
      }

      const result = await handleReportAnalysis({
        photoDataUri,
        audioDataUri,
        textDescription: data.textDescription,
        geolocation: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setAnalysisResult(result);
      toast({
        title: 'Report Submitted',
        description: 'Analysis completed successfully.',
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setAnalysisResult(null);
    setPhotoPreview(null);
    setIsSubmitting(false);
  };

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="mt-4 text-lg font-semibold">Analyzing Report...</h3>
        <p className="mt-2 text-sm text-muted-foreground">Our AI is assessing the situation and identifying needs. Please wait.</p>
      </div>
    );
  }

  if (analysisResult) {
    return <AnalysisResults result={analysisResult} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="photo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capture Photo</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center gap-2">
                      {photoPreview && (
                        <Image
                          src={photoPreview}
                          alt="Photo preview"
                          width={400}
                          height={300}
                          className="w-full h-auto aspect-[4/3] object-cover rounded-lg border bg-muted"
                        />
                      )}
                      {/* Hidden input to bind FileList to RHF */}
                      <input
                        ref={cameraInputRef}
                        type="file"
                        name={field.name}
                        className="sr-only"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                      <CameraCapture
                        onCapture={(file) => {
                          const dt = new DataTransfer();
                          dt.items.add(file);
                          if (cameraInputRef.current) {
                            cameraInputRef.current.files = dt.files;
                            const evt = new Event('change', { bubbles: true });
                            cameraInputRef.current.dispatchEvent(evt);
                          }
                          setPhotoPreview(URL.createObjectURL(file));
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio Recording (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="audio/*"
                      className="file:text-primary file:font-semibold"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="textDescription"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Text Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what you see and hear. What immediate help is needed?"
                    className="flex-1 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Incident Type selection */}
        <FormField
          control={form.control}
          name="incidentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Incident Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {incidentTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Manual location fetch */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={fetchLocation} disabled={locationStatus === 'fetching'}>
              {locationStatus === 'fetching' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching Location...
                </>
              ) : (
                <>Fetch Current Location</>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {locationStatus === 'idle' && 'Location not fetched yet.'}
              {locationStatus === 'success' && 'Location fetched.'}
              {locationStatus === 'error' && 'Failed to fetch location.'}
              {locationStatus === 'unsupported' && 'Geolocation unsupported.'}
            </span>
          </div>
          {/* Hidden geolocation inputs bound to form */}
          <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
          <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" size="lg" disabled={!isReady}>
            <Upload className="mr-2 h-4 w-4" />
            Analyze Report
          </Button>
        </div>
      </form>
    </Form>
  );
}
