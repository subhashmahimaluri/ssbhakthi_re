import { useLocation } from '@/context/LocationContext';
import { useState } from 'react';
import { Button, Collapse } from 'react-bootstrap';
import AutoComplete from './AutoComplete';

interface Location {
  city: string;
  country: string;
}

interface SelectedLocationData {
  city: string;
  province: string;
  country: string;
  iso2: string;
  lat: number;
  lng: number;
  timezone: string;
}

export default function LocationAccordion({ city, country }: Location) {
  const [open, setOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const { setLocationData } = useLocation();

  const handleLocationSelect = (locationData: SelectedLocationData) => {
    setSelectedLocation(locationData);
  };

  const handleSubmit = async () => {
    if (selectedLocation) {
      setIsSubmitting(true);
      setSubmitProgress(0);

      // Simulate progress steps with smooth animation
      const progressSteps = [20, 40, 60, 80, 100];

      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setSubmitProgress(progressSteps[i]);
      }

      // Apply the location change
      setLocationData(selectedLocation);

      // Show success state
      setShowSuccess(true);

      // Reset state with delay for smooth transition
      setTimeout(() => {
        setSelectedLocation(null);
        setSubmitProgress(0);
        setShowSuccess(false);
        setIsSubmitting(false);
        setOpen(false);
      }, 1500);
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    setOpen(false);
  };

  return (
    <div className="location-selector">
      {/* Compact Header */}
      <div
        className={`location-header d-flex justify-content-between align-items-center rounded border p-2 ${showSuccess ? 'success-glow' : ''}`}
        onClick={() => !isSubmitting && setOpen(!open)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if ((e.key === 'Enter' || e.key === ' ') && !isSubmitting) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <div className="location-info d-flex align-items-center flex-grow-1">
          <i
            className={`fas fa-map-marker-alt text-primary me-2 ${isSubmitting ? 'pulse-icon' : ''}`}
          ></i>
          <div className="location-text">
            <div className="current-location text-truncate">
              <strong className="text-dark">{city}</strong>
              <span className="text-muted d-none d-sm-inline">, {country}</span>
              {showSuccess && (
                <span className="badge bg-success fade-in ms-2">
                  <i className="fas fa-check me-1"></i>Updated!
                </span>
              )}
            </div>
            <small className="text-muted d-block d-sm-none">{country}</small>
          </div>
        </div>

        <Button
          variant="outline-primary"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-controls="location-collapse"
          aria-expanded={open}
          className="change-location-btn"
        >
          <i className={`fas ${open ? 'fa-times' : 'fa-edit'} d-none d-sm-inline me-1`}></i>
          <span className="d-none d-md-inline">{open ? 'Cancel' : 'Change'}</span>
          <i className={`fas ${open ? 'fa-times' : 'fa-edit'} d-sm-none`}></i>
        </Button>
      </div>

      {/* Collapsible Location Selector */}
      <Collapse in={open}>
        <div id="location-collapse">
          <div className="location-selector-body border-top-0 rounded-bottom bg-light border p-3">
            <div className="mb-2">
              <label className="form-label small text-muted">
                <i className="fas fa-search me-1"></i>
                Search for a city:
              </label>
            </div>
            <AutoComplete
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
            {selectedLocation && (
              <div className="location-preview slide-down mt-3 rounded border bg-white p-2">
                <div className="d-flex align-items-center mb-2">
                  <img
                    className="flag-bounce me-2 rounded"
                    src={`https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/${selectedLocation.iso2}.svg`}
                    alt="Flag"
                    width="20"
                    height="15"
                  />
                  <div>
                    <div className="fw-bold text-dark">{selectedLocation.city}</div>
                    <small className="text-muted">
                      {selectedLocation.province}, {selectedLocation.country}
                    </small>
                  </div>
                </div>

                {/* Progress Bar */}
                {isSubmitting && (
                  <div className="progress mb-2" style={{ height: '4px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${submitProgress}%`, transition: 'width 0.3s ease' }}
                    ></div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button
                    variant={showSuccess ? 'success' : 'primary'}
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-grow-1 submit-btn ${isSubmitting ? 'submitting' : ''} ${showSuccess ? 'success-state' : ''}`}
                  >
                    {showSuccess ? (
                      <>
                        <i className="fas fa-check-circle bounce-in me-1"></i>
                        Applied Successfully!
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm spin-animation me-1"
                          role="status"
                          aria-hidden="true"
                        ></div>
                        Applying... ({submitProgress}%)
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-1"></i>
                        Apply Location
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className={`cancel-btn ${isSubmitting ? 'disabled-state' : ''}`}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-2">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Select a city to update astronomical calculations for your location.
              </small>
            </div>
          </div>
        </div>
      </Collapse>

      <style jsx>{`
        .location-selector {
          font-family: inherit;
        }

        .location-header {
          background-color: #f8f9fa;
          border-color: #dee2e6 !important;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .location-header:hover {
          background-color: #e9ecef;
          border-color: #007bff !important;
        }

        .location-text {
          min-width: 0;
          flex: 1;
        }

        .current-location {
          font-size: 14px;
          line-height: 1.2;
        }

        .change-location-btn {
          border-radius: 20px;
          font-size: 12px;
          padding: 4px 12px;
          font-weight: 500;
          min-width: auto;
          white-space: nowrap;
        }

        .location-selector-body {
          background-color: #f8f9fa;
          border-color: #dee2e6 !important;
        }

        /* Animation Classes */
        .pulse-icon {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .success-glow {
          animation: success-glow 1s ease-in-out;
          border-color: #28a745 !important;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        .slide-down {
          animation: slideDown 0.3s ease-out;
        }

        .flag-bounce {
          animation: flagBounce 0.6s ease-out;
        }

        .location-preview {
          transform-origin: top;
          transition: all 0.3s ease;
        }

        .submit-btn {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .submit-btn.submitting {
          transform: scale(0.98);
        }

        .submit-btn.success-state {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        .bounce-in {
          animation: bounceIn 0.6s ease-out;
        }

        .spin-animation {
          animation: spin 1s linear infinite;
        }

        .cancel-btn {
          transition: all 0.2s ease;
        }

        .cancel-btn.disabled-state {
          opacity: 0.5;
          transform: scale(0.95);
        }

        /* Keyframe Animations */
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes success-glow {
          0% {
            box-shadow: 0 0 0 rgba(40, 167, 69, 0);
          }
          50% {
            box-shadow: 0 0 20px rgba(40, 167, 69, 0.5);
          }
          100% {
            box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
          }
        }

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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-15px) scaleY(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }

        @keyframes flagBounce {
          0% {
            transform: scale(0) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Progress Bar Enhancements */
        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar {
          background: linear-gradient(45deg, #007bff, #0056b3);
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .progress-bar-animated {
          animation: progress-bar-stripes 1s linear infinite;
        }

        @keyframes progress-bar-stripes {
          0% {
            background-position: 1rem 0;
          }
          100% {
            background-position: 0 0;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 576px) {
          .location-header {
            padding: 8px 12px;
          }

          .current-location {
            font-size: 13px;
          }

          .change-location-btn {
            padding: 4px 8px;
            min-width: 32px;
          }

          .location-selector-body {
            padding: 12px;
          }
        }

        /* Extra small screens */
        @media (max-width: 375px) {
          .location-text {
            font-size: 12px;
          }

          .current-location strong {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
