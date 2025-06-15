// ============================================================================
// RESTAURANT MANAGEMENT PAGE
// Restaurant Loyalty Platform - Complete Restaurant Management Interface
// ============================================================================

import React, { useState } from 'react';
import { RestaurantDashboard, CreateRestaurantModal } from '@/components/restaurant';
import { PageErrorBoundary } from '@/components/ErrorBoundary';
import type { ClientDataForRestaurantView } from '@/types/database';
import { useSearchParams } from 'react-router-dom';

// ============================================================================
// MODAL STATE TYPE
// ============================================================================

interface ModalState {
  createRestaurant: boolean;
  editRestaurant: { isOpen: boolean; restaurant: ClientDataForRestaurantView | null };
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

  // Obtain clientId from URL (e.g., /restaurants?clientId=xxx)
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No client selected.
      </div>
    );
  }

  // Modal handlers
  const handleCreateRestaurant = () => {
    setModalState(prev => ({
      ...prev,
      createRestaurant: true
    }));
  };

  const handleEditRestaurant = (restaurant: ClientDataForRestaurantView) => {
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