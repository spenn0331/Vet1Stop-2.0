"use client";

import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { HealthResource, RequestInfoFormData } from '../types/HealthResourceTypes';
import { formatPhoneNumber } from '../utils/health-resource-utils';

interface StandaloneRequestModalProps {
  resource: HealthResource;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: RequestInfoFormData) => void;
}

/**
 * A standalone modal for requesting information from health resources
 * This component is designed to be positioned above all other content,
 * including the crisis banner, by using extremely high z-index values
 */
const StandaloneRequestModal: React.FC<StandaloneRequestModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<RequestInfoFormData>({
    resourceId: resource.id,
    name: '',
    email: '',
    phone: '',
    serviceDetails: '',
    serviceStatus: '',
    specificQuestions: '',
    preferredContact: 'email',
    veteranStatus: false,
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.preferredContact === 'phone' && !formData.phone) {
      newErrors.phone = 'Phone number is required for phone contact preference';
    }
    
    if (!formData.serviceStatus) {
      newErrors.serviceStatus = 'Please select your service status';
    }
    
    if (!formData.serviceDetails.trim()) {
      newErrors.serviceDetails = 'Please provide details about the services you need';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms to submit this request';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would send the data to an API
      await onSubmit(formData);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        setFormData({
          resourceId: resource.id,
          name: '',
          email: '',
          phone: '',
          serviceDetails: '',
          serviceStatus: '',
          specificQuestions: '',
          preferredContact: 'email',
          veteranStatus: false,
          agreeToTerms: false
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Use inline styles with extremely high z-index values to ensure the modal appears above all other content
  const modalStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  };

  const modalContentStyles: React.CSSProperties = {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '32rem',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    zIndex: 10000
  };

  const headerStyles: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    paddingBottom: '1rem',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    zIndex: 10001
  };

  return (
    <div style={modalStyles} onClick={onClose}>
      <div 
        style={modalContentStyles} 
        onClick={(e) => e.stopPropagation()}
        className="standalone-request-modal"
      >
        <div style={headerStyles}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-900">
              Request Information from {resource.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        {submitSuccess ? (
          <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
            <p className="font-medium">Request Submitted Successfully!</p>
            <p className="mt-1">Thank you for your interest. The organization will contact you shortly.</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Fill out this form to request more information about this resource. The organization will contact you directly.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.name ? 'border-red-500' : ''
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="your.email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.phone ? 'border-red-500' : ''
                  }`}
                  placeholder="(123) 456-7890"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              {/* Service Status */}
              <div>
                <label htmlFor="serviceStatus" className="block text-sm font-medium text-gray-700">
                  Service Status <span className="text-red-600">*</span>
                </label>
                <select
                  name="serviceStatus"
                  id="serviceStatus"
                  value={formData.serviceStatus}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.serviceStatus ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select your status</option>
                  <option value="active">Active Duty</option>
                  <option value="veteran">Veteran</option>
                  <option value="reserve">Reserve/National Guard</option>
                  <option value="family">Military Family Member</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="other">Other</option>
                </select>
                {errors.serviceStatus && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceStatus}</p>
                )}
              </div>
              
              {/* Service Details */}
              <div>
                <label htmlFor="serviceDetails" className="block text-sm font-medium text-gray-700">
                  Service Details Needed <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="serviceDetails"
                  id="serviceDetails"
                  rows={3}
                  value={formData.serviceDetails}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.serviceDetails ? 'border-red-500' : ''}`}
                  placeholder="Please describe what services you're interested in..."
                />
                {errors.serviceDetails && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceDetails}</p>
                )}
              </div>
              
              {/* Specific Questions */}
              <div>
                <label htmlFor="specificQuestions" className="block text-sm font-medium text-gray-700">
                  Specific Questions or Information Needed
                </label>
                <textarea
                  name="specificQuestions"
                  id="specificQuestions"
                  rows={3}
                  value={formData.specificQuestions}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Please let us know what specific information you're looking for..."
                />
              </div>
              
              {/* Preferred Contact Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="contact-email"
                      name="preferredContact"
                      type="radio"
                      value="email"
                      checked={formData.preferredContact === 'email'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="contact-email" className="ml-2 block text-sm text-gray-700">
                      Email
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="contact-phone"
                      name="preferredContact"
                      type="radio"
                      value="phone"
                      checked={formData.preferredContact === 'phone'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="contact-phone" className="ml-2 block text-sm text-gray-700">
                      Phone
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="contact-either"
                      name="preferredContact"
                      type="radio"
                      value="either"
                      checked={formData.preferredContact === 'either'}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="contact-either" className="ml-2 block text-sm text-gray-700">
                      Either
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Veteran Status */}
              <div>
                <div className="flex items-center">
                  <input
                    id="veteranStatus"
                    name="veteranStatus"
                    type="checkbox"
                    checked={formData.veteranStatus}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      veteranStatus: e.target.checked
                    }))}
                    className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="veteranStatus" className="ml-2 block text-sm text-gray-700">
                    I am a veteran or active duty military member
                  </label>
                </div>
              </div>
              
              {/* Terms Agreement */}
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        agreeToTerms: e.target.checked
                      }))}
                      className={`h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded ${errors.agreeToTerms ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div className="ml-2 text-sm">
                    <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                      I agree to the <a href="#" className="text-blue-600 hover:text-blue-800">Terms of Service</a> and <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a> <span className="text-red-600">*</span>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {errors.submit && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                  {errors.submit}
                </div>
              )}
              
              <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneRequestModal;
