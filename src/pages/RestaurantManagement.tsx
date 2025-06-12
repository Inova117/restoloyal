// ============================================================================
// RESTAURANT MANAGEMENT PAGE
// Restaurant Loyalty Platform - Complete Restaurant Management Interface
// ============================================================================

import React, { useState } from 'react';
import { RestaurantDashboard, CreateRestaurantModal } from '@/components/restaurant';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import type { RestaurantData } from '@/services/platform';

// ============================================================================
// MODAL STATE TYPE
// ============================================================================

interface ModalState {
  createRestaurant: boolean;
  editRestaurant: { isOpen: boolean; restaurant: RestaurantData | null };
  createLocation: { isOpen: boolean; restaurantId: string | null };
  createStaff: { isOpen: boolean; restaurantId: string | null };
}

// ============================================================================
// RESTAURANT MANAGEMENT PAGE COMPONENT
// ============================================================================

export const RestaurantManagement: React.FC = () => {
  const [modalState, setModalState] = useState<ModalState>({
    createRestaurant: false,
    editRestaurant: { isOpen: false, restaurant: null },
    createLocation: { isOpen: false, restaurantId: null },
    createStaff: { isOpen: false, restaurantId: null }
  });

  // For demo purposes, using a mock client ID
  // In a real app, this would come from authentication context or route params
  const clientId = 'demo-client-id';

  // Modal handlers
  const handleCreateRestaurant = () => {
    setModalState(prev => ({
      ...prev,
      createRestaurant: true
    }));
  };

  const handleEditRestaurant = (restaurant: RestaurantData) => {
    setModalState(prev => ({
      ...prev,
      editRestaurant: { isOpen: true, restaurant }
    }));
  };

  const handleCreateLocation = (restaurantId: string) => {
    setModalState(prev => ({
      ...prev,
      createLocation: { isOpen: true, restaurantId }
    }));
  };

  const handleCreateStaffMember = (restaurantId: string) => {
    setModalState(prev => ({
      ...prev,
      createStaff: { isOpen: true, restaurantId }
    }));
  };

  const closeModal = (modalName: keyof ModalState) => {
    setModalState(prev => ({
      ...prev,
      [modalName]: typeof prev[modalName] === 'object' 
        ? { isOpen: false, restaurant: null, restaurantId: null }
        : false
    }));
  };

  const handleModalSuccess = () => {
    // Refresh data is handled automatically by the useClientManagement hook
    // Close the modal
    setModalState({
      createRestaurant: false,
      editRestaurant: { isOpen: false, restaurant: null },
      createLocation: { isOpen: false, restaurantId: null },
      createStaff: { isOpen: false, restaurantId: null }
    });
  };

  return (
    <PageErrorBoundary>
      {/* Main Dashboard */}
      <RestaurantDashboard
        clientId={clientId}
        onCreateRestaurant={handleCreateRestaurant}
        onEditRestaurant={handleEditRestaurant}
        onCreateLocation={handleCreateLocation}
        onCreateStaffMember={handleCreateStaffMember}
      />

      {/* Create Restaurant Modal */}
      <CreateRestaurantModal
        isOpen={modalState.createRestaurant}
        onClose={() => closeModal('createRestaurant')}
        clientId={clientId}
        onSuccess={handleModalSuccess}
      />

      {/* TODO: Add other modals */}
      {/* 
      - EditRestaurantModal
      - CreateLocationModal  
      - CreateStaffMemberModal
      */}
    </PageErrorBoundary>
  );
}; 