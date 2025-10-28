import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useOrganization } from '@/context/OrganizationContext';
import { colors } from '@/styles/globalStyles';
import { IconSymbol } from './IconSymbol';

interface OrganizationSelectorProps {
  onOrganizationChange?: (orgId: string) => void;
}

export default function OrganizationSelector({ onOrganizationChange }: OrganizationSelectorProps) {
  const { 
    currentOrganization, 
    userOrganizations, 
    switchOrganization, 
    loading 
  } = useOrganization();
  
  const [modalVisible, setModalVisible] = useState(false);

  const handleOrganizationSelect = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
      onOrganizationChange?.(orgId);
      setModalVisible(false);
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <IconSymbol name="building.2" size={20} color={colors.primary} />
          <View style={styles.textContainer}>
            <Text style={styles.organizationName}>
              {currentOrganization?.orgName || 'Select Organization'}
            </Text>
            <Text style={styles.organizationSubtext}>
              {userOrganizations.length} organization{userOrganizations.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Organization</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={userOrganizations}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.organizationItem,
                  currentOrganization?.$id === item.$id && styles.selectedOrganization
                ]}
                onPress={() => handleOrganizationSelect(item.$id)}
              >
                <View style={styles.organizationItemContent}>
                  <IconSymbol 
                    name="building.2" 
                    size={24} 
                    color={currentOrganization?.$id === item.$id ? colors.primary : colors.textSecondary} 
                  />
                  <View style={styles.organizationItemText}>
                    <Text style={[
                      styles.organizationItemName,
                      currentOrganization?.$id === item.$id && styles.selectedText
                    ]}>
                      {item.orgName}
                    </Text>
                    {item.description && (
                      <Text style={styles.organizationItemDescription}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {currentOrganization?.$id === item.$id && (
                    <IconSymbol name="checkmark" size={20} color={colors.primary} />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  selector: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  organizationSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 20,
  },
  organizationItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedOrganization: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  organizationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  organizationItemText: {
    flex: 1,
    marginLeft: 12,
  },
  organizationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedText: {
    color: colors.primary,
  },
  organizationItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 12,
  },
});
