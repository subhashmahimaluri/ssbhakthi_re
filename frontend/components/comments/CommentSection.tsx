'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { signIn, useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Comment {
  id: string;
  canonicalSlug: string;
  lang: string;
  userId: string;
  userName: string;
  userEmail?: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
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

// Individual comment component with edit/delete functionality
interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  currentUserEmail?: string; // Add email for ownership check
  authToken?: string;
  onCommentUpdated: () => void;
  onCommentDeleted: () => void;
  onRequestDelete: (comment: Comment) => void;
}

const CommentItem = ({
  comment,
  currentUserId,
  currentUserEmail,
  authToken,
  onCommentUpdated,
  onCommentDeleted,
  onRequestDelete,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if current user owns this comment (by userId or email)
  const isOwnerByUserId = currentUserId && comment.userId === currentUserId;
  const isOwnerByEmail =
    currentUserEmail && comment.userEmail && comment.userEmail === currentUserEmail;
  const isOwner = isOwnerByUserId || isOwnerByEmail;

  // Debug logging for ownership check
  console.log('🔍 Comment ownership check:', {
    commentId: comment.id,
    commentUserId: comment.userId,
    commentUserEmail: comment.userEmail,
    currentUserId: currentUserId,
    currentUserEmail: currentUserEmail,
    isOwnerByUserId,
    isOwnerByEmail,
    isOwner,
  });

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

  // Handle edit mode activation
  const handleEditClick = () => {
    setIsEditing(true);
    setEditText(comment.text);
    setUpdateError(null);
    // Focus textarea after a short delay
    setTimeout(() => {
      if (editTextareaRef.current) {
        editTextareaRef.current.focus();
        editTextareaRef.current.setSelectionRange(editText.length, editText.length);
      }
    }, 100);
  };

  // Handle edit cancellation
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(comment.text);
    setUpdateError(null);
  };

  // Handle comment update
  const handleUpdateComment = async () => {
    if (!editText.trim() || editText === comment.text) {
      handleCancelEdit();
      return;
    }

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const token = authToken || 'dev-token-for-testing'; // Use passed token or fallback

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL}/rest/comments/${comment.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: editText.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update comment');
      }

      setIsEditing(false);
      setUpdateError(null);
      onCommentUpdated(); // Refresh comments list
    } catch (error) {
      console.error('Error updating comment:', error);
      setUpdateError(error instanceof Error ? error.message : 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete button click (request delete from parent)
  const handleDeleteClick = () => {
    setUpdateError(null); // Clear any existing errors
    onRequestDelete(comment);
  };

  return (
    <div className="d-flex mb-4">
      <div className="me-3">
        <Avatar name={comment.userName} />
      </div>
      <div className="flex-grow-1">
        <div className={`card border-0 shadow-sm ${isEditing ? 'border-primary' : ''}`}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div className="d-flex align-items-center">
                <h6 className="fw-bold text-primary mb-0 me-2">{comment.userName}</h6>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <small className="text-muted">
                    <i className="bi bi-pencil-square me-1"></i>
                    edited
                  </small>
                )}
              </div>
              <div className="d-flex align-items-center">
                <small className="text-muted me-2">{formatDate(comment.createdAt)}</small>

                {/* Action buttons for comment owner */}
                {isOwner && !isEditing && (
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-link text-muted comment-actions-menu p-0"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ fontSize: '1rem' }}
                    >
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={handleEditClick}
                        >
                          <i className="bi bi-pencil-square text-primary me-2"></i>
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item d-flex align-items-center text-danger"
                          onClick={handleDeleteClick}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-trash text-danger me-2"></i>
                              Delete
                            </>
                          )}
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Comment content or edit form */}
            {isEditing ? (
              <div className="edit-form-container">
                <div className="mb-3">
                  <textarea
                    ref={editTextareaRef}
                    className="form-control"
                    rows={3}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    disabled={isUpdating}
                    maxLength={1000}
                    style={{
                      resize: 'vertical',
                      minHeight: '80px',
                      transition: 'all 0.3s ease',
                    }}
                  />
                  <small className="text-muted d-block mt-1">
                    {editText.length}/1000 characters
                    {editText.length > 800 && (
                      <span className="text-warning ms-2">Approaching limit</span>
                    )}
                  </small>
                </div>

                {updateError && (
                  <div className="alert alert-danger mb-3 py-2">
                    <small>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {updateError}
                    </small>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateComment}
                    disabled={
                      !editText.trim() ||
                      editText === comment.text ||
                      isUpdating ||
                      editText.length > 1000
                    }
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        Save
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-dark mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                  {comment.text}
                </p>

                {/* Show error for delete operations */}
                {updateError && !isEditing && (
                  <div className="alert alert-danger mt-3 py-2">
                    <small>
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      {updateError}
                    </small>
                    <button
                      type="button"
                      className="btn-close btn-close-sm float-end"
                      onClick={() => setUpdateError(null)}
                      style={{ fontSize: '0.75rem' }}
                    ></button>
                  </div>
                )}
              </>
            )}
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

  // Modal state management
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Helper function to get current user ID from session
  const getCurrentUserId = (): string | undefined => {
    if (!session?.user) return undefined;

    // In development, try to generate the same user ID as backend
    if (process.env.NODE_ENV === 'development') {
      if (session.user.email) {
        // Generate same ID format as backend: user-{email with @ and . replaced by -}
        const userId = `user-${session.user.email.replace(/[@.]/g, '-')}`;
        console.log('🆔 Frontend generated user ID:', userId, 'for email:', session.user.email);
        return userId;
      }
      return 'dev-user-123';
    }

    // In production, extract from JWT or session
    return (session as any).sub || (session as any).userId;
  };

  // Callback for when a comment is updated
  const handleCommentUpdated = useCallback(() => {
    fetchComments();
  }, [fetchComments]);

  // Callback for when a comment is deleted
  const handleCommentDeleted = useCallback(() => {
    fetchComments();
    setTotalComments(prev => Math.max(0, prev - 1));
  }, [fetchComments]);

  // Handle delete request from CommentItem
  const handleDeleteRequest = useCallback((comment: Comment) => {
    setCommentToDelete(comment);
    setShowDeleteModal(true);
  }, []);

  // Handle actual comment deletion
  const handleDeleteComment = useCallback(async () => {
    if (!commentToDelete) return;

    setIsDeleting(true);
    setShowDeleteModal(false);

    try {
      const authToken = session?.accessToken || 'dev-token-for-testing';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL}/rest/comments/${commentToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete comment');
      }

      handleCommentDeleted();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setCommentsError(error instanceof Error ? error.message : 'Failed to delete comment');
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  }, [commentToDelete, session?.accessToken, handleCommentDeleted]);

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

        /* Enhanced dropdown and modal styles */
        .dropdown-menu {
          z-index: 1050 !important;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
        }

        .dropdown-toggle::after {
          display: none !important;
        }

        .comment-item {
          position: relative;
          z-index: 1;
        }

        .comment-item .dropdown {
          position: relative;
          z-index: 100;
        }

        .comment-item .dropdown.show {
          z-index: 1000;
        }

        .comment-item:hover {
          z-index: 10;
        }

        .modal.show {
          animation: modalFadeIn 0.3s ease-out;
          z-index: 9999 !important;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .comment-actions-menu {
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .comment-item:hover .comment-actions-menu {
          opacity: 1;
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
                  <CommentItem
                    comment={comment}
                    currentUserId={getCurrentUserId()}
                    currentUserEmail={session?.user?.email || undefined}
                    authToken={session?.accessToken || 'dev-token-for-testing'}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                    onRequestDelete={handleDeleteRequest}
                  />
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

        {/* Global Delete Confirmation Modal */}
        {showDeleteModal && commentToDelete && (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9999,
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            onClick={e => {
              if (e.target === e.currentTarget) {
                setShowDeleteModal(false);
                setCommentToDelete(null);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title text-danger d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Delete Comment
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCommentToDelete(null);
                    }}
                    disabled={isDeleting}
                  ></button>
                </div>
                <div className="modal-body pt-2">
                  <p className="text-muted mb-1">Are you sure you want to delete this comment?</p>
                  <div className="bg-light mt-3 rounded p-3">
                    <small className="text-muted d-block mb-1">Your comment:</small>
                    <p
                      className="mb-0"
                      style={{
                        maxHeight: '80px',
                        overflow: 'hidden',
                        fontSize: '0.9rem',
                      }}
                    >
                      {commentToDelete.text.length > 100
                        ? commentToDelete.text.substring(0, 100) + '...'
                        : commentToDelete.text}
                    </p>
                  </div>
                  <div className="alert alert-warning mb-0 mt-3 py-2">
                    <small>
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>This action cannot be undone.</strong>
                    </small>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCommentToDelete(null);
                    }}
                    disabled={isDeleting}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteComment}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-1"></i>
                        Delete Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
