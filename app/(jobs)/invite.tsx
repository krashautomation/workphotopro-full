import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Share } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import QRCode from 'react-native-qrcode-svg';

export default function InviteScreen() {
  const [inviteLink] = useState('https://links.workphotos.com/ZnmNNi2t4Wb');
  const [teamName] = useState('Gardening Team');
  const [currentMembers] = useState(1);
  const [maxMembers] = useState(3);


  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join my team "${teamName}" on WorkPhotos: ${inviteLink}`,
        url: inviteLink,
        title: `Join ${teamName} on WorkPhotos`,
      });
    } catch (error) {
      console.error('Error sharing link:', error);
      Alert.alert('Error', 'Failed to share link');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Invite',
          headerBackTitle: '',
          headerBackVisible: true,
        }} 
      />
      
      <View style={styles.content}>
        {/* Team Information Section */}
        <View style={styles.teamInfoSection}>
          <View style={styles.teamIconContainer}>
            <View style={styles.teamIcon}>
              <View style={styles.teamIconGrid}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <View key={index} style={styles.teamIconDot} />
                ))}
              </View>
              <Text style={styles.teamIconText}>Team 2</Text>
            </View>
          </View>
          
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{teamName}</Text>
            <View style={styles.capacityBar}>
              <Text style={styles.capacityText}>
                Team capacity: <Text style={styles.capacityNumbers}>{currentMembers}</Text> of <Text style={styles.capacityNumbers}>{maxMembers}</Text> members
              </Text>
            </View>
          </View>
        </View>

        {/* Invitation Link and QR Code Section */}
        <View style={styles.inviteSection}>
          <Text style={styles.inviteLink}>{inviteLink}</Text>
          
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={inviteLink}
              size={200}
              color={Colors.Black}
              backgroundColor={Colors.White}
            />
          </View>
          
          <Text style={styles.qrInstructions}>
            Scan the QR code to add teammates in person
          </Text>
          
          <Text style={styles.noteText}>
            Note: This will not log-in a person. They will need a WorkPhotos account before scanning.
          </Text>
        </View>

        {/* Share Link Option */}
        <View style={styles.shareSection}>
          <Text style={styles.orText}>or</Text>
          
          <Pressable style={styles.shareButton} onPress={handleShareLink}>
            <IconSymbol name="paperplane" color={Colors.White} size={20} />
            <Text style={styles.shareButtonText}>Share link</Text>
          </Pressable>
        </View>

        {/* Permissions Information */}
        <View style={styles.permissionsSection}>
          <Text style={styles.permissionsText}>
            Teammates can view, create and update jobs in this workspace.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.White,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  teamInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  teamIconContainer: {
    marginRight: 16,
  },
  teamIcon: {
    width: 60,
    height: 60,
    backgroundColor: Colors.Purple,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 24,
    height: 16,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teamIconDot: {
    width: 4,
    height: 4,
    backgroundColor: Colors.White,
    borderRadius: 2,
  },
  teamIconText: {
    color: Colors.White,
    fontSize: 10,
    fontWeight: '500',
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.Black,
    marginBottom: 8,
  },
  capacityBar: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 14,
    color: Colors.Black,
  },
  capacityNumbers: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  inviteSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  inviteLink: {
    fontSize: 16,
    color: Colors.Black,
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.White,
    borderRadius: 12,
    shadowColor: Colors.Black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInstructions: {
    fontSize: 16,
    color: Colors.Black,
    textAlign: 'center',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: Colors.Black,
    textAlign: 'center',
    lineHeight: 20,
  },
  shareSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  orText: {
    fontSize: 16,
    color: Colors.Black,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 160,
  },
  shareButtonText: {
    color: Colors.White,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionsSection: {
    alignItems: 'center',
  },
  permissionsText: {
    fontSize: 14,
    color: Colors.Black,
    textAlign: 'center',
    lineHeight: 20,
  },
});
