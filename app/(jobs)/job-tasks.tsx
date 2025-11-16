import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from '@/utils/colors'
import { CalendarCheck, LayoutList } from 'lucide-react-native'

type JobTasksProps = {
    jobId: string
}

export default function JobTasks({ jobId }: JobTasksProps) {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Duties Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <LayoutList color={Colors.Primary} size={24} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.sectionTitle}>Duties</Text>
                            <Text style={styles.sectionDescription}>Ongoing job duties</Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No duties yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Duties created in this job will show up here.
                        </Text>
                    </View>
                </View>

                {/* Tasks Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <CalendarCheck color={Colors.Primary} size={24} />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.sectionTitle}>Tasks</Text>
                            <Text style={styles.sectionDescription}>Current tasks in this job</Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No tasks yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Tasks created in this job will show up here.
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray,
    },
    headerTextContainer: {
        flex: 1,
    },
    sectionTitle: {
        color: Colors.Text,
        fontSize: 20,
        fontWeight: '600',
    },
    sectionDescription: {
        color: Colors.Gray,
        fontSize: 14,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: Colors.Text,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: Colors.Gray,
        fontSize: 14,
        textAlign: 'center',
    },
})

