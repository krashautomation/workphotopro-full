import { globalStyles, colors } from '@/styles/globalStyles';
import { useRouter } from 'expo-router';
import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { Coins, Gem, Trophy } from 'lucide-react-native';

export default function Achievements() {
  const router = useRouter();

  // Placeholder quest data
  const quests = [
    { id: '1', title: 'Complete First Job', description: 'Create and complete your first job', completed: true, xp: 10 },
    { id: '2', title: 'Team Player', description: 'Invite 5 team members', completed: true, xp: 10 },
    { id: '3', title: 'Photo Master', description: 'Upload 100 photos', completed: false, xp: 5 },
    { id: '4', title: 'Tag Expert', description: 'Use tags in 10 different jobs', completed: false, xp: 5 },
    { id: '5', title: 'Organizer', description: 'Create 20 jobs', completed: false, xp: 10 },
  ];

  // Placeholder achievements data
  const achievements = [
    { id: '1', title: 'Newcomer', description: 'Welcome to WorkPhotoPro!', icon: 'star.fill', completed: true, gems: 5 },
    { id: '2', title: 'First Steps', description: 'Created your first job', icon: 'circle.fill', completed: true, gems: 10 },
    { id: '3', title: 'Collaborator', description: 'Joined a team', icon: 'person.3.fill', completed: true, gems: 5 },
    { id: '4', title: 'Photographer', description: 'Uploaded 50 photos', icon: 'camera.fill', completed: false, gems: 10 },
    { id: '5', title: 'Tag Master', description: 'Created 5 custom tags', icon: 'tag.fill', completed: false, gems: 5 },
    { id: '6', title: 'Organized', description: 'Completed 10 jobs', icon: 'checkmark.circle.fill', completed: false, gems: 10 },
  ];

  const renderQuest = ({ item }: { item: typeof quests[0] }) => (
    <View style={styles.questCard}>
      <View style={styles.questContent}>
        <View style={styles.questIconContainer}>
          <Coins size={18} color={item.completed ? "#FFD700" : colors.textMuted} />
          <Text style={[styles.questXP, item.completed && styles.questXPCompleted]}>
            +{item.xp}
          </Text>
        </View>
        <View style={styles.questTextContainer}>
          <Text style={styles.questText} numberOfLines={1}>
            <Text style={[styles.questTitle, item.completed && styles.questTitleCompleted]}>
              {item.title}
            </Text>
            <Text style={styles.questDescription}> • {item.description}</Text>
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAchievement = ({ item }: { item: typeof achievements[0] }) => {
    return (
      <View style={styles.achievementCard}>
        <View style={styles.achievementContent}>
          <View style={styles.achievementIconContainer}>
            <Gem size={18} color={item.completed ? "#9333EA" : colors.textMuted} />
            <Text style={[styles.achievementGems, item.completed && styles.achievementGemsCompleted]}>
              +{item.gems}
            </Text>
          </View>
          <View style={styles.achievementTextContainer}>
            <Text style={styles.achievementText} numberOfLines={1}>
              <Text style={[styles.achievementTitle, item.completed && styles.achievementTitleCompleted]}>
                {item.title}
              </Text>
              <Text style={styles.achievementDescription}> • {item.description}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Trophy size={24} color="#FFD700" />
          <Text style={styles.headerTitle}>Awards and Achievements</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Explainer Section */}
        <View style={styles.explainerSection}>
          <Text style={styles.explainerTitle}>Track Your Progress</Text>
          <Text style={styles.explainerText}>
            Complete quests to earn experience points and unlock achievements. 
            Your progress is tracked across all jobs and teams.
          </Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Coins size={20} color="#FFD700" />
              <Text style={styles.statValue}>1,250</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
            <View style={styles.statItem}>
              <Gem size={20} color="#9333EA" />
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Quests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Coins size={18} color="#FFD700" />
            <Text style={styles.sectionTitle}>Quests</Text>
          </View>
          {quests.map((quest, index) => (
            <View key={quest.id}>
              {renderQuest({ item: quest })}
              {index < quests.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gem size={18} color="#9333EA" />
            <Text style={styles.sectionTitle}>Achievements</Text>
          </View>
          {achievements.map((achievement, index) => (
            <View key={achievement.id}>
              {renderAchievement({ item: achievement })}
              {index < achievements.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 32,
  },
  explainerSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  explainerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  explainerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  questCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  questContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  questXP: {
    fontSize: 12,
    fontWeight: '700',
    color: "#FFD700",
  },
  questXPCompleted: {
    color: colors.textMuted,
  },
  questTextContainer: {
    flex: 1,
  },
  questText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  questTitleCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  questDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  achievementIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  achievementGems: {
    fontSize: 12,
    fontWeight: '700',
    color: "#9333EA",
  },
  achievementGemsCompleted: {
    color: colors.textMuted,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  achievementTitleCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  achievementDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  separator: {
    height: 12,
  },
});
