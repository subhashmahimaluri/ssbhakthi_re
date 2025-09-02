'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';

interface Comment {
  id: string;
  author: string;
  date: string;
  text: string;
  avatar?: string;
}

interface CommentSectionProps {
  contentType: 'stotra' | 'article';
  canonicalSlug: string;
}

// Static comments for Phase 1
const STATIC_COMMENTS: Comment[] = [
  {
    id: '1',
    author: 'Devotee Ram',
    date: '2024-12-28',
    text: 'This stotra is so beautiful and peaceful. I recite it every morning during my prayers. Thank you for sharing this wonderful content.',
  },
  {
    id: '2',
    author: 'Bhakti Seeker',
    date: '2024-12-27',
    text: 'The meaning provided here really helps understand the deeper significance. Very grateful for this detailed explanation.',
  },
  {
    id: '3',
    author: 'Spiritual Student',
    date: '2024-12-26',
    text: 'Can you please add the audio pronunciation guide as well? It would be very helpful for beginners like me.',
  },
];

// Generate avatar initials from name
const getAvatarInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Avatar component
const Avatar = ({ name, size = 40 }: { name: string; size?: number }) => {
  const initials = getAvatarInitials(name);
  const bgColors = [
    'bg-primary',
    'bg-secondary',
    'bg-success',
    'bg-danger',
    'bg-warning',
    'bg-info',
    'bg-dark',
  ];
  const colorIndex = name.length % bgColors.length;

  return (
    <div
      className={`d-flex align-items-center justify-content-center rounded-circle fw-bold text-white ${bgColors[colorIndex]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
};

// Individual comment component
const CommentItem = ({ comment }: { comment: Comment }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="d-flex mb-4">
      <div className="me-3">
        <Avatar name={comment.author} />
      </div>
      <div className="flex-grow-1">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="fw-bold text-primary mb-0">{comment.author}</h6>
              <small className="text-muted">{formatDate(comment.date)}</small>
            </div>
            <p className="text-dark mb-0">{comment.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CommentSection component
export default function CommentSection({ contentType, canonicalSlug }: CommentSectionProps) {
  const { data: session, status } = useSession();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = () => {
    signIn('keycloak');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !commentText.trim()) return;

    setIsSubmitting(true);

    // Phase 1: Just console.log the comment payload
    const commentPayload = {
      user: {
        name: session.user?.name,
        email: session.user?.email,
      },
      text: commentText.trim(),
      contentType,
      canonicalSlug,
      timestamp: new Date().toISOString(),
    };

    console.log('Comment submission payload:', commentPayload);

    // Simulate API call delay
    setTimeout(() => {
      setCommentText('');
      setIsSubmitting(false);
      alert('Comment submitted! (Check console for payload)');
    }, 1000);
  };

  const isLoggedIn = status === 'authenticated' && session;
  const isLoading = status === 'loading';

  return (
    <div className="mt-5">
      {/* Comments Section Header */}
      <div className="border-bottom mb-4 pb-3">
        <h2 className="h3 text-primary mb-0">Comments</h2>
        <small className="text-muted">{STATIC_COMMENTS.length} comments</small>
      </div>

      {/* Comment Form */}
      <div className="mb-5">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <textarea
              className="form-control"
              rows={4}
              placeholder={isLoggedIn ? 'Share your thoughts...' : 'Login to leave a comment'}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={!isLoggedIn || isLoading || isSubmitting}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <div>
              {isLoggedIn && (
                <small className="text-muted">
                  Commenting as <strong>{session.user?.name || session.user?.email}</strong>
                </small>
              )}
            </div>

            <div>
              {isLoggedIn ? (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!commentText.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Submitting...
                    </>
                  ) : (
                    'Comment'
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Loading...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div>
        {STATIC_COMMENTS.length > 0 ? (
          <>
            {STATIC_COMMENTS.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </>
        ) : (
          <div className="py-5 text-center">
            <div className="text-muted">
              <i className="fas fa-comments fa-3x mb-3 opacity-50"></i>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
