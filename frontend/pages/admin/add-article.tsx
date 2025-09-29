import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { Alert, Container } from 'react-bootstrap';

interface AddArticlePageProps {
  userRoles: string[];
}

export default function AddArticlePage({ userRoles }: AddArticlePageProps) {
  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>⚠️ Known Issue with Article Creation</Alert.Heading>
          <p>
            We're currently experiencing a database validation issue that prevents creating new
            articles. However, <strong>editing existing articles works perfectly</strong>.
          </p>
          <hr />
          <p className="mb-0">
            <strong>Workaround:</strong> Please use the "View Articles" section to edit existing
            articles, or contact the administrator for assistance with creating new content.
          </p>
        </Alert>
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
