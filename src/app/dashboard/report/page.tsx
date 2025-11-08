import ReportForm from '@/components/dashboard/report-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportPage() {
  return (
    <div className="flex justify-center items-start">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle>Report a Climate Incident</CardTitle>
          <CardDescription>
            Submit a report with a photo or audio to alert the network. Your location will be attached automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportForm />
        </CardContent>
      </Card>
    </div>
  );
}
