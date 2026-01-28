import { StrataTraasaClient } from './strata-trasa-client';
import { currentUser } from '@/lib/auth';
import CommonPageTemplate from '@/components/structure/CommonPageTemplate';

export default async function StrataTraasaPage() {
  const user = await currentUser();
  
  return (
    <CommonPageTemplate contents={{ complete: true }} currentUser={user}>
      <StrataTraasaClient userId={user?.id} />
    </CommonPageTemplate>
  );
}
