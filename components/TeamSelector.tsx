import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useOrganization } from '@/context/OrganizationContext';
import { colors } from '@/styles/globalStyles';
import { IconSymbol } from './IconSymbol';

interface TeamSelectorProps {
  onTeamChange?: (teamId: string) => void;
}

export default function TeamSelector({ onTeamChange }: TeamSelectorProps) {
  const { 
    currentTeam, 
    userTeams, 
    switchTeam, 
    loading 
  } = useOrganization();
  
  const [modalVisible, setModalVisible] = useState(false);

  const handleTeamSelect = async (teamId: string) => {
    try {
      await switchTeam(teamId);
      onTeamChange?.(teamId);
      setModalVisible(false);
    } catch (error) {
      console.error('Error switching team:', error);
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
          <IconSymbol name="person.3" size={20} color={colors.primary} />
          <View style={styles.textContainer}>
            <Text style={styles.teamName}>
              {currentTeam?.teamName || 'Select Team'}
            </Text>
            <Text style={styles.teamSubtext}>
              {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
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
            <Text style={styles.modalTitle}>Select Team</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <IconSymbol name="xmark" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={userTeams}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.teamItem,
                  currentTeam?.$id === item.$id && styles.selectedTeam
                ]}
                onPress={() => handleTeamSelect(item.$id)}
              >
                <View style={styles.teamItemContent}>
                  <IconSymbol 
                    name="person.3" 
                    size={24} 
                    color={currentTeam?.$id === item.$id ? colors.primary : colors.textSecondary} 
                  />
                  <View style={styles.teamItemText}>
                    <Text style={[
                      styles.teamItemName,
                      currentTeam?.$id === item.$id && styles.selectedText
                    ]}>
                      {item.teamName}
                    </Text>
                    {item.description && (
                      <Text style={styles.teamItemDescription}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {currentTeam?.$id === item.$id && (
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
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  teamSubtext: {
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
  teamItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedTeam: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  teamItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  teamItemText: {
    flex: 1,
    marginLeft: 12,
  },
  teamItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  selectedText: {
    color: colors.primary,
  },
  teamItemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 12,
  },
});
