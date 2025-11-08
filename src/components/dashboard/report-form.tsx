'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { handleReportAnalysis } from '@/app/dashboard/report/actions';
import AnalysisResults from './analysis-results';
import { Loader2, Upload, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const reportSchema = z.object({
  photo: z.any().refine(file => file?.length === 1, "A photo is required."),
  audio: z.any().optional(),
  textDescription: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;
export type AnalysisResultData = Awaited<ReturnType<typeof handleReportAnalysis>>;

const fileToDataUri = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export default function ReportForm() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Could not get your location. Please enable location services in your browser settings. Using a default location for now.");
          // Fallback to a default location if user denies permission
          setLocation({ latitude: 34.0522, longitude: -118.2437 });
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser. Using a default location.");
      setLocation({ latitude: 34.0522, longitude: -118.2437 });
    }
  }, []);

  const onSubmit = async (data: ReportFormValues) => {
    if (!location) {
        toast({
            variant: "destructive",
            title: "Location not available",
            description: "We couldn't determine your location. Please ensure location services are enabled.",
        });
        return;
    }
      
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
            geolocation: location
        });
        
        if (result.error) {
            throw new Error(result.error);
        }

        setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
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
  }

  const defaultPhoto = PlaceHolderImages.find(p => p.id === 'default-report-photo');

  if (isSubmitting) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="mt-4 text-lg font-semibold">Analyzing Report...</h3>
            <p className="mt-2 text-sm text-muted-foreground">Our AI is assessing the situation and identifying needs. Please wait.</p>
        </div>
    )
  }
  
  if (analysisResult) {
    return <AnalysisResults result={analysisResult} onReset={handleReset} />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {locationError && (
            <Alert variant="destructive">
                <LocateFixed className="h-4 w-4" />
                <AlertTitle>Location Error</AlertTitle>
                <AlertDescription>{locationError}</AlertDescription>
            </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Photo Evidence</FormLabel>
                        <FormControl>
                            <div className="flex flex-col items-center gap-2">
                                <Image 
                                    src={photoPreview || defaultPhoto?.imageUrl || ''} 
                                    alt="Photo preview"
                                    width={400}
                                    height={300}
                                    className="w-full h-auto aspect-[4/3] object-cover rounded-lg border bg-muted"
                                    data-ai-hint={defaultPhoto?.imageHint}
                                />
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="file:text-primary file:font-semibold"
                                    onChange={(e) => {
                                        field.onChange(e.target.files);
                                        if (e.target.files && e.target.files[0]) {
                                            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                                        }
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

        <div className="flex justify-end gap-4">
            <Button type="submit" size="lg" disabled={!location}>
                <Upload className="mr-2 h-4 w-4" />
                Analyze Report
            </Button>
        </div>
      </form>
    </Form>
  );
}
