import PledgeForm from '@/components/dashboard/pledge-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PledgePage() {
  return (
    <div className="flex justify-center items-start">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Pledge Your Support</CardTitle>
          <CardDescription>
            Join the resilience network by offering resources. Your contribution can make a critical difference in an emergency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PledgeForm />
        </CardContent>
      </Card>
    </div>
  );
}
