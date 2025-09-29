import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { Container } from 'react-bootstrap';

interface AddArticlePageProps {
  userRoles: string[];
}

export default function AddArticlePage({ userRoles }: AddArticlePageProps) {
  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <ArticleEditor />
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
