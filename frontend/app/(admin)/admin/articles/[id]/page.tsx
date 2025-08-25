import ArticleEditor from '@/components/admin/ArticleEditor';

interface EditArticlePageProps {
  params: {
    id: string;
  };
}

export default function EditArticlePage({ params }: EditArticlePageProps) {
  return <ArticleEditor articleId={params.id} />;
}
