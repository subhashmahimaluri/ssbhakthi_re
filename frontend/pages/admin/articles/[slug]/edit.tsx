import Layout from '@/components/Layout/Layout';
import AdminNav from '@/components/admin/AdminNav';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { Container } from 'react-bootstrap';

interface EditArticlePageProps {
  userRoles: string[];
  articleSlug: string;
}

export default function EditArticlePage({ userRoles, articleSlug }: EditArticlePageProps) {
  // We'll need to get the article ID from the slug
  // For now, we'll pass the slug as the articleId to the ArticleEditor
  // The ArticleEditor will need to be updated to handle slug-based lookups

  return (
    <Layout>
      <AdminNav />
      <Container className="py-4">
        <ArticleEditor articleId={articleSlug} />
      </Container>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { slug } = context.params as { slug: string };

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
      articleSlug: slug,
    },
  };
};
