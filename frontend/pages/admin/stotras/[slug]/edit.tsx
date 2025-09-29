import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import StotraEditor from '@/components/admin/StotraEditor';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { useRouter } from 'next/router';
import { Container } from 'react-bootstrap';

interface EditStotraPageProps {
  userRoles: string[];
}

export default function EditStotraPage({ userRoles }: EditStotraPageProps) {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <StotraEditor stotraId={slug as string} />
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const userRoles = (session.user?.roles as string[]) || [];
  const hasAdminAccess = userRoles.some(role => ['admin', 'editor', 'author'].includes(role));

  if (!hasAdminAccess) {
    return {
      redirect: {
        destination: '/my-account',
        permanent: false,
      },
    };
  }

  return {
    props: {
      userRoles,
    },
  };
};
