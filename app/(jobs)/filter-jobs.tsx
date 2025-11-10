import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import Avatar from '@/components/Avatar';
import { Colors } from '@/utils/colors';
import { useOrganization } from '@/context/OrganizationContext';
import { tagService } from '@/lib/appwrite/database';
import { teamService } from '@/lib/appwrite/teams';
import { TagTemplate } from '@/utils/types';
import BottomModal2 from '@/components/BottomModal2';

const STATUS_OPTIONS: Array<{ id: 'active' | 'completed'; label: string; indicator?: string }> = [
  { id: 'active', label: 'Current', indicator: '👈' },
  { id: 'completed', label: 'Complete', indicator: '✅' },
];

export default function FilterJobs() {
  const router = useRouter();
  const { currentTeam } = useOrganization();

  const [selectedStatuses, setSelectedStatuses] = React.useState<Array<'active' | 'completed'>>([]);
  const [tagTemplates, setTagTemplates] = React.useState<TagTemplate[]>([]);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = React.useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(true);

  const loadTags = React.useCallback(async () => {
    try {
      setIsLoadingTags(true);
      const templatesResponse = await tagService.getActiveTagTemplates();
      setTagTemplates(templatesResponse.documents as unknown as TagTemplate[]);
    } catch (error) {
      console.error('FilterJobs: error loading tags', error);
      Alert.alert('Error', 'Failed to load tags. Please try again.');
    } finally {
      setIsLoadingTags(false);
    }
  }, []);

  const loadTeamMembers = React.useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      if (currentTeam?.$id) {
        const memberships = await teamService.listMemberships(currentTeam.$id);
        setTeamMembers(memberships.memberships);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('FilterJobs: error loading team members', error);
      Alert.alert('Error', 'Failed to load team members. Please try again.');
    } finally {
      setIsLoadingMembers(false);
    }
  }, [currentTeam]);

  React.useEffect(() => {
    loadTags();
  }, [loadTags]);

  React.useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const toggleStatus = (statusId: 'active' | 'completed') => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((value) => value !== statusId) : [...prev, statusId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((value) => value !== tagId) : [...prev, tagId]
    );
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((value) => value !== memberId) : [...prev, memberId]
    );
  };

  const getMemberDisplayName = (member: any): string => {
    if (member.userInfo?.name) {
      return member.userInfo.name;
    }

    if (member.userName && member.userName.trim()) {
      return member.userName.trim();
    }

    let email = member.userEmail || member.email || '';
    if ((!email || !email.includes('@')) && member.userInfo?.email) {
      email = member.userInfo.email;
    }
    if ((!email || !email.includes('@')) && member.membershipData?.userEmail) {
      email = member.membershipData.userEmail;
    }

    if (email && email.includes('@')) {
      const emailName = email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    const shortUserId = member.userId ? member.userId.slice(0, 8) : 'member';
    return `Member ${shortUserId}`;
  };

  const getMemberProfilePicture = (member: any): string | undefined => {
    if (member.membershipData?.profilePicture && member.membershipData.profilePicture.trim()) {
      return member.membershipData.profilePicture.trim();
    }
    if (member.profilePicture && member.profilePicture.trim()) {
      return member.profilePicture.trim();
    }
    if (member.userInfo?.profilePicture) {
      return member.userInfo.profilePicture;
    }
    return undefined;
  };

  const handleClose = React.useCallback(() => {
    router.back();
  }, [router]);

  return (
    <BottomModal2
      visible
      onClose={handleClose}
      minHeightRatio={0.6}
      overlayStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
      contentStyle={{ backgroundColor: Colors.Surface }}
    >
      <View style={styles.topBar}>
        <View style={styles.topBorder} />
        <View style={styles.handle} />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Job Status</Text>
          <View style={styles.card}>
            {STATUS_OPTIONS.map((option, index) => {
              const isSelected = selectedStatuses.includes(option.id);
              const showDivider = index < STATUS_OPTIONS.length - 1;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.listItem, showDivider && styles.listItemDivider]}
                  onPress={() => toggleStatus(option.id)}
                >
                  <View style={styles.itemContent}>
                    {option.indicator && (
                      <Text style={styles.statusIcon}>{option.indicator}</Text>
                    )}
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {option.label}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, styles.checkboxTrailing, isSelected && styles.checkboxSelected]}>
                    {isSelected && <IconSymbol name="checkmark" color={Colors.White} size={16} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Tags</Text>
          {isLoadingTags ? (
            <View style={[styles.card, styles.placeholderCard]}>
              <ActivityIndicator size="small" color={Colors.Primary} />
              <Text style={[styles.placeholderText, styles.placeholderTextWithMargin]}>
                Loading tags...
              </Text>
            </View>
          ) : tagTemplates.length === 0 ? (
            <View style={[styles.card, styles.placeholderCard]}>
              <Text style={styles.placeholderText}>
                No tags available. Contact your administrator to set up tags.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {tagTemplates.map((tag, index) => {
                const isSelected = selectedTagIds.includes(tag.$id);
                const showDivider = index < tagTemplates.length - 1;
                return (
                  <Pressable
                    key={tag.$id}
                    style={[styles.listItem, showDivider && styles.listItemDivider]}
                    onPress={() => toggleTag(tag.$id)}
                  >
                    <View style={styles.itemContent}>
                      <IconSymbol
                        name={(tag.icon as any) || 'circle'}
                        color={tag.color}
                        size={16}
                        style={styles.tagIcon}
                      />
                      <Text style={styles.itemText}>{tag.name}</Text>
                    </View>
                    <View style={[styles.checkbox, styles.checkboxTrailing, isSelected && styles.checkboxSelected]}>
                      {isSelected && <IconSymbol name="checkmark" color={Colors.White} size={16} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter by Team Members</Text>
          {isLoadingMembers ? (
            <View style={[styles.card, styles.placeholderCard]}>
              <ActivityIndicator size="small" color={Colors.Primary} />
              <Text style={[styles.placeholderText, styles.placeholderTextWithMargin]}>
                Loading team members...
              </Text>
            </View>
          ) : teamMembers.length === 0 ? (
            <View style={[styles.card, styles.placeholderCard]}>
              <Text style={styles.placeholderText}>
                No team members found. Please select a team.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              {teamMembers.map((member, index) => {
                const memberId = member.$id || member.userId || `${index}`;
                const memberName = getMemberDisplayName(member);
                const memberProfilePicture = getMemberProfilePicture(member);
                const memberRole = member.membershipData?.role || member.roles?.[0] || 'member';
                const isSelected = selectedMemberIds.includes(memberId);
                const showDivider = index < teamMembers.length - 1;

                return (
                  <Pressable
                    key={memberId}
                    style={[styles.listItem, showDivider && styles.listItemDivider]}
                    onPress={() => toggleMember(memberId)}
                  >
                    <View style={styles.memberInfo}>
                      <Avatar name={memberName} imageUrl={memberProfilePicture} size={40} />
                      <View style={styles.memberTextWrapper}>
                        <Text style={styles.memberName}>{memberName}</Text>
                        <Text style={styles.memberRole}>{memberRole}</Text>
                      </View>
                    </View>
                    <View style={[styles.checkbox, styles.checkboxTrailing, isSelected && styles.checkboxSelected]}>
                      {isSelected && <IconSymbol name="checkmark" color={Colors.White} size={16} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </BottomModal2>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    marginBottom: 10,
  },
  topBorder: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.Gray,
    marginBottom: 2
  },
  handle: {
    width: 80,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.Gray,
    marginTop: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.Gray,
    marginBottom: 0,
  },
  card: {
    backgroundColor: Colors.Secondary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.Gray,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    color: Colors.Text,
    fontSize: 16,
  },
  itemTextSelected: {
    fontWeight: '600',
  },
  indicator: {
    fontSize: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: Colors.Gray,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxLeading: {
    marginRight: 12,
  },
  checkboxTrailing: {
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: Colors.Primary,
    backgroundColor: Colors.Primary,
  },
  tagIcon: {
    marginRight: 12,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: Colors.Gray,
    fontSize: 14,
    textAlign: 'center',
  },
  placeholderTextWithMargin: {
    marginLeft: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    color: Colors.Text,
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    color: Colors.Gray,
    fontSize: 14,
    textTransform: 'capitalize',
  },
});