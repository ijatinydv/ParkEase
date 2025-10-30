import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * PhotoGallery Component
 * Displays spot images with lightbox functionality
 */
const PhotoGallery = ({ images = [] }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-neutral-200 rounded-lg flex items-center justify-center">
        <p className="text-neutral-500">No images available</p>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-4 gap-2 h-[400px] rounded-xl overflow-hidden">
        {/* Main large image */}
        <div className="col-span-4 md:col-span-2 row-span-2 relative group">
          <img
            src={images[0]}
            alt="Parking spot main view"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => openLightbox(0)}
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity cursor-pointer" />
        </div>

        {/* Thumbnail grid */}
        {images.slice(1, 5).map((image, index) => (
          <div
            key={index + 1}
            className="col-span-2 md:col-span-1 relative group overflow-hidden"
          >
            <img
              src={image}
              alt={`Parking spot view ${index + 2}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => openLightbox(index + 1)}
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity cursor-pointer" />
            
            {/* Show all photos button on last thumbnail */}
            {index === 3 && images.length > 5 && (
              <button
                onClick={() => openLightbox(index + 1)}
                className="absolute inset-0 bg-black bg-opacity-60 hover:bg-opacity-70 transition-all flex items-center justify-center text-white font-semibold"
              >
                <span className="text-lg">+{images.length - 5} more</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* View all photos button (mobile) */}
      <button
        onClick={() => openLightbox(0)}
        className="md:hidden mt-4 w-full py-3 border-2 border-neutral-900 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
      >
        View All {images.length} Photos
      </button>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            onClick={closeLightbox}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
              aria-label="Close lightbox"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-4 z-10 px-4 py-2 rounded-full bg-black bg-opacity-50 text-white text-sm font-medium">
              {currentImageIndex + 1} / {images.length}
            </div>

            {/* Previous button */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
            )}

            {/* Next button */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
                aria-label="Next image"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            )}

            {/* Main image */}
            <motion.img
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              src={images[currentImageIndex]}
              alt={`Parking spot view ${currentImageIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Thumbnail navigation */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 py-2 bg-black bg-opacity-50 rounded-lg">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PhotoGallery;
