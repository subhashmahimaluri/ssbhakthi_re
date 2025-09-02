'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Comment {
  id: string;
  canonicalSlug: string;
  lang: string;
  userName: string;
  userEmail?: string;
  text: string;
  createdAt: string;
}

interface CommentSectionProps {
  contentType: 'stotra' | 'article';
  canonicalSlug: string;
}

interface CommentsResponse {
  items: Comment[];
  total: number;
  pagination?: {
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    canonicalSlug: string;
    language: string;
    contentId: string;
  };
}

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="d-flex mb-4">
      <div className="me-3">
        <Avatar name={comment.userName} />
      </div>
      <div className="flex-grow-1">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="fw-bold text-primary mb-0">{comment.userName}</h6>
              <small className="text-muted">{formatDate(comment.createdAt)}</small>
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
  const { locale } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [totalComments, setTotalComments] = useState(0);

  // Refs for smooth scrolling and animations
  const commentsListRef = useRef<HTMLDivElement>(null);
  const latestCommentRef = useRef<HTMLDivElement>(null);

  // Fetch comments function
  const fetchComments = useCallback(async () => {
    try {
      setIsLoadingComments(true);
      setCommentsError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL}/rest/comments/${canonicalSlug}?lang=${locale}&limit=20&offset=0`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch comments');
      }

      const data: CommentsResponse = await response.json();
      setComments(data.items);
      setTotalComments(data.total);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setCommentsError(error instanceof Error ? error.message : 'Failed to load comments');
      setComments([]);
      setTotalComments(0);
    } finally {
      setIsLoadingComments(false);
    }
  }, [canonicalSlug, locale]);

  // Load comments when component mounts or dependencies change
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleLogin = () => {
    signIn('keycloak');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !session) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null); // Clear previous errors
    setSubmissionSuccess(false); // Clear previous success state

    try {
      const requestBody = {
        canonicalSlug,
        lang: locale,
        text: commentText.trim(),
      };

      console.log('Submitting comment with payload:', requestBody);
      console.log('Session access token exists:', !!session.accessToken);
      console.log('Content type:', contentType);
      console.log('Canonical slug:', canonicalSlug);

      // For development testing, use a dummy token if no real token exists
      const authToken = session.accessToken || 'dev-token-for-testing';

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_REST_URL}/rest/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit comment';
        try {
          const errorData = await response.json();
          console.error('Backend error response:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          console.error('Raw response status:', response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Comment submitted successfully:', result);

      // Show success feedback with animation
      setSubmissionSuccess(true);

      // Clear form
      setCommentText('');
      setSubmissionError(null);

      // Refresh comments to show the new comment
      await fetchComments();

      // Add a smooth scroll to the latest comment after refresh
      setTimeout(() => {
        if (latestCommentRef.current) {
          latestCommentRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start',
          });
        } else if (commentsListRef.current) {
          // Fallback: scroll to comments section
          commentsListRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 400);

      // Hide success message after 4 seconds
      setTimeout(() => {
        setSubmissionSuccess(false);
      }, 4000);
    } catch (error) {
      console.error('Error submitting comment:', error);
      // Set a user-friendly error message for display
      if (error instanceof Error) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError('Failed to submit comment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoggedIn = status === 'authenticated' && session;
  const isLoading = status === 'loading';

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          40%,
          43% {
            transform: translate3d(0, -4px, 0);
          }
          70% {
            transform: translate3d(0, -2px, 0);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }

        .comment-success-pulse {
          animation: pulse 0.6s ease-in-out;
        }

        .comment-bounce {
          animation: bounce 0.8s ease-in-out;
        }

        .comment-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }

        .comment-form-submitting {
          position: relative;
          overflow: hidden;
        }

        .comment-form-submitting::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 1.5s infinite;
        }
      `}</style>

      <div className="mt-5">
        {/* Comments Section Header */}
        <div className="border-bottom mb-4 pb-3">
          <h2 className="h3 text-primary mb-0">Comments</h2>
          <small className="text-muted">
            {isLoadingComments
              ? 'Loading comments...'
              : `${totalComments} comment${totalComments !== 1 ? 's' : ''}`}
          </small>
        </div>

        {/* Comment Form */}
        <div className={`mb-5 ${isSubmitting ? 'comment-form-submitting' : ''}`}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <textarea
                className={`form-control ${isSubmitting ? 'comment-shimmer' : ''}`}
                rows={4}
                placeholder={isLoggedIn ? 'Share your thoughts...' : 'Login to leave a comment'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={!isLoggedIn || isLoading || isSubmitting}
                style={{
                  resize: 'vertical',
                  transition: 'all 0.3s ease',
                  ...(isSubmitting && {
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed',
                  }),
                }}
              />
              {commentText.length > 0 && (
                <small className="text-muted d-block mt-1">
                  {commentText.length}/1000 characters
                  {commentText.length > 800 && (
                    <span className="text-warning ms-2">Approaching limit</span>
                  )}
                  {commentText.length >= 1000 && (
                    <span className="text-danger ms-2">Character limit reached</span>
                  )}
                </small>
              )}
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
                    className={`btn btn-primary ${isSubmitting ? 'comment-shimmer' : ''}`}
                    disabled={!commentText.trim() || isSubmitting || commentText.length > 1000}
                    style={{
                      transition: 'all 0.3s ease',
                      minWidth: '120px',
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Posting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-chat-left-text me-2"></i>
                        Post Comment
                      </>
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
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login to Comment
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Display submission success */}
          {submissionSuccess && (
            <div
              className="alert alert-success comment-bounce mt-3"
              role="alert"
              style={{
                animation: 'fadeIn 0.3s ease-in, bounce 0.8s ease-in-out',
                border: '2px solid #d1e7dd',
                backgroundColor: '#d1e7dd',
                borderRadius: '8px',
              }}
            >
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill text-success fs-5 me-2"></i>
                <div>
                  <strong>🎉 Success!</strong> Your comment has been added successfully.
                  <br />
                  <small className="text-success-emphasis">Scrolling to your comment...</small>
                </div>
              </div>
            </div>
          )}

          {/* Display submission error */}
          {submissionError && (
            <div
              className="alert alert-danger mt-3"
              role="alert"
              style={{
                animation: 'fadeIn 0.3s ease-in',
                border: '2px solid #f5c6cb',
                borderRadius: '8px',
              }}
            >
              <div className="d-flex align-items-start justify-content-between">
                <div className="d-flex align-items-start">
                  <i className="bi bi-exclamation-triangle-fill text-danger fs-5 me-2 mt-1"></i>
                  <div>
                    <strong>Error!</strong> {submissionError}
                    <br />
                    <small className="text-danger-emphasis">
                      Please try again or contact support if the issue persists.
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSubmissionError(null)}
                  style={{ fontSize: '0.875rem' }}
                ></button>
              </div>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div ref={commentsListRef}>
          {isLoadingComments ? (
            <div className="py-4 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading comments...</span>
              </div>
              <p className="text-muted mb-0 mt-2">Loading comments...</p>
            </div>
          ) : commentsError ? (
            <div className="py-4 text-center">
              <div className="alert alert-warning" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Error loading comments:</strong> {commentsError}
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={fetchComments}
                disabled={isLoadingComments}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Try Again
              </button>
            </div>
          ) : comments.length > 0 ? (
            <>
              <div className="mb-3">
                <h3 className="h5 text-secondary mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>
                  Recent Comments
                </h3>
              </div>
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  ref={index === 0 ? latestCommentRef : null}
                  className={`comment-item ${index === 0 && submissionSuccess ? 'comment-bounce' : ''}`}
                  style={{
                    animation:
                      index === 0 && submissionSuccess
                        ? 'slideInLeft 0.5s ease-out, pulse 0.6s ease-in-out 0.5s'
                        : `fadeIn 0.3s ease-in ${index * 0.1}s both`,
                    transform: 'translateZ(0)', // Force hardware acceleration
                  }}
                >
                  <CommentItem comment={comment} />
                </div>
              ))}

              {/* Show pagination indicator if there are more comments */}
              {totalComments > comments.length && (
                <div className="mt-4 text-center">
                  <div className="alert alert-info py-2">
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      Showing {comments.length} of {totalComments} comments.
                      {/* TODO: Add "Load More" functionality */}
                    </small>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-5 text-center">
              <div className="text-muted">
                <i className="bi bi-chat-left fs-1 d-block mb-3 opacity-50"></i>
                <h4 className="text-muted mb-2">No comments yet</h4>
                <p className="mb-0">Be the first to share your thoughts!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
