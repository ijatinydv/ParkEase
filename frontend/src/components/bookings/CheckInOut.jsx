import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle, XCircle, AlertCircle, MapPin, Clock } from 'lucide-react';
import verificationService from '../../services/verificationService';
import Button from '../common/Button';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';

/**
 * CheckInOut Component
 * Handles photo verification for check-in and check-out
 */
const CheckInOut = ({ booking, type = 'checkin', onSuccess, onCancel }) => {
  const [step, setStep] = useState('capture'); // capture, preview, verifying, result
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [countdownTime, setCountdownTime] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Calculate check-in window countdown
  useEffect(() => {
    if (type === 'checkin' && booking?.startTime) {
      const calculateCountdown = () => {
        const now = new Date();
        const startTime = new Date(booking.startTime);
        const checkInWindowStart = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 min before
        const checkInWindowEnd = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour after

        if (now < checkInWindowStart) {
          const diff = checkInWindowStart - now;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdownTime({ hours, minutes, status: 'waiting' });
        } else if (now >= checkInWindowStart && now <= checkInWindowEnd) {
          const diff = checkInWindowEnd - now;
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setCountdownTime({ hours, minutes, status: 'active' });
        } else {
          setCountdownTime({ hours: 0, minutes: 0, status: 'expired' });
        }
      };

      calculateCountdown();
      const interval = setInterval(calculateCountdown, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [booking, type]);

  // Get current location
  const handleGetLocation = async () => {
    setLocationLoading(true);
    setError(null);

    try {
      const currentLocation = await verificationService.getCurrentLocation();
      setLocation(currentLocation);
    } catch (err) {
      console.error('Location error:', err);
      setError(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Failed to access camera. Please check permissions or use file upload.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], `${type}-photo-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });

      setPhotoFile(file);
      setPhotoPreview(canvas.toDataURL('image/jpeg'));
      setStep('preview');
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  // Handle file upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate image quality
    const validation = await verificationService.validateImageQuality(file);
    if (!validation.valid && validation.warnings.length > 0) {
      setError(validation.warnings[0]);
    }

    // Compress image
    try {
      const compressedFile = await verificationService.compressImage(file);
      setPhotoFile(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setStep('preview');
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to process image. Please try another photo.');
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setStep('capture');
    setError(null);
  };

  // Submit photo for verification
  const handleVerifySubmit = async () => {
    if (!photoFile) {
      setError('Please capture or upload a photo first');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('verifying');

    try {
      const result = await verificationService.verifyPhoto(
        booking._id,
        photoFile,
        {
          notes,
          location,
          attemptNumber,
          type
        }
      );

      setVerificationResult(result);
      setStep('result');

      if (result.success) {
        // Success - call onSuccess after a brief delay
        setTimeout(() => {
          onSuccess?.(result.data);
        }, 2000);
      } else {
        // Failed - allow retry if attempts remaining
        if (result.data?.verification?.remainingAttempts > 0) {
          setAttemptNumber(prev => prev + 1);
        }
      }

    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Render countdown timer
  const renderCountdown = () => {
    if (!countdownTime) return null;

    const { hours, minutes, status } = countdownTime;

    if (status === 'waiting') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <Clock className="w-5 h-5" />
            <div>
              <p className="font-medium">Check-in opens in:</p>
              <p className="text-2xl font-bold">{hours}h {minutes}m</p>
              <p className="text-sm">Check-in window: 30 min before booking start</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'active') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Check-in window active</p>
              <p className="text-lg">Time remaining: {hours}h {minutes}m</p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'expired') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <p className="font-medium">Check-in window expired</p>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render capture step
  const renderCaptureStep = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">
        {type === 'checkin' ? 'Check-In Photo' : 'Check-Out Photo'}
      </h3>

      <p className="text-gray-600">
        Take a clear photo of the parking spot to verify your {type === 'checkin' ? 'arrival' : 'departure'}.
      </p>

      {type === 'checkin' && renderCountdown()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {attemptNumber > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Attempt {attemptNumber} of 3
          </p>
        </div>
      )}

      {cameraActive ? (
        <div className="space-y-3">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={capturePhoto} className="flex-1">
              <Camera className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
            <Button onClick={stopCamera} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button onClick={startCamera} className="flex items-center justify-center gap-2">
            <Camera className="w-5 h-5" />
            Open Camera
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Photo
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* Photo tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-sm text-gray-700 mb-2">📸 Photo Tips:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ensure good lighting</li>
          <li>• Capture the entire parking spot</li>
          <li>• Keep the camera steady (avoid blurry images)</li>
          <li>• Take photo from a clear angle</li>
          <li>• Match the view from listing photos</li>
        </ul>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Review Photo</h3>

      <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
        <img
          src={photoPreview}
          alt="Preview"
          className="w-full h-auto"
        />
        <button
          onClick={retakePhoto}
          className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Optional notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about the parking spot condition..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows="3"
          maxLength="500"
        />
        <p className="text-xs text-gray-500 mt-1">{notes.length}/500</p>
      </div>

      {/* Location */}
      <div>
        <Button
          onClick={handleGetLocation}
          variant="outline"
          size="sm"
          disabled={locationLoading || location}
          className="flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {locationLoading ? 'Getting location...' : location ? 'Location captured ✓' : 'Add Location'}
        </Button>
        {location && (
          <p className="text-xs text-gray-500 mt-1">
            Accuracy: ±{Math.round(location.accuracy)}m
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleVerifySubmit} className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Verifying...
            </>
          ) : (
            'Verify & Submit'
          )}
        </Button>
        <Button onClick={retakePhoto} variant="outline">
          Retake
        </Button>
      </div>
    </div>
  );

  // Render verifying step
  const renderVerifyingStep = () => (
    <div className="py-12 text-center space-y-4">
      <Spinner size="lg" className="mx-auto" />
      <h3 className="text-xl font-semibold">Verifying Photo...</h3>
      <p className="text-gray-600">
        Our AI is analyzing your photo. This may take a few seconds.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <div className="animate-pulse">●</div>
        <div className="animate-pulse animation-delay-200">●</div>
        <div className="animate-pulse animation-delay-400">●</div>
      </div>
    </div>
  );

  // Render result step
  const renderResultStep = () => {
    if (!verificationResult) return null;

    const { success, message, data } = verificationResult;

    if (success) {
      return (
        <div className="py-8 text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-600">Photo Verified!</h3>
          <p className="text-gray-600">{message}</p>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-800">
              Confidence: {(data?.verification?.confidence * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      );
    } else {
      const verification = data?.verification || {};
      const remainingAttempts = verification.remainingAttempts || 0;

      return (
        <div className="py-8 space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 text-center">Verification Failed</h3>
          <p className="text-gray-600 text-center">{message}</p>

          {verification.confidence !== undefined && (
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-800 mb-2">
                Confidence: {(verification.confidence * 100).toFixed(1)}% 
                (Required: {(verification.threshold * 100)}%)
              </p>
              <p className="text-sm text-red-800">
                {verification.reason}
              </p>
            </div>
          )}

          {verification.tips && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-sm text-gray-700 mb-2">💡 Tips to improve:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {verification.tips.map((tip, index) => (
                  <li key={index}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {remainingAttempts > 0 ? (
            <div className="space-y-2">
              <p className="text-center font-medium">
                {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
              </p>
              <Button onClick={retakePhoto} className="w-full">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 text-center">
                Maximum attempts reached. Please contact support for assistance.
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={type === 'checkin' ? 'Check-In Verification' : 'Check-Out Verification'}
      size="lg"
    >
      <div className="p-6">
        {step === 'capture' && renderCaptureStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'verifying' && renderVerifyingStep()}
        {step === 'result' && renderResultStep()}
      </div>
    </Modal>
  );
};

export default CheckInOut;
