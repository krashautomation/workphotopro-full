import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { IconSymbol } from '@/components/IconSymbol';
import { cacheManager, CacheStats, CacheConfig } from '@/utils/cacheManager';
import { offlineCache } from '@/utils/offlineCache';

export default function CacheSettingsScreen() {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [config, setConfig] = useState<CacheConfig | null>(null);
    const [offlineStats, setOfflineStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [cleaning, setCleaning] = useState(false);

    const loadStats = async () => {
        try {
            setLoading(true);
            await offlineCache.initialize();
            const [cacheStats, cacheConfig, offlineCacheStats] = await Promise.all([
                cacheManager.getCacheStats(),
                Promise.resolve(cacheManager.getConfig()),
                offlineCache.getCacheStats(),
            ]);
            setStats(cacheStats);
            setConfig(cacheConfig);
            setOfflineStats(offlineCacheStats);
        } catch (error) {
            console.error('[CacheSettings] Error loading stats:', error);
            Alert.alert('Error', 'Failed to load cache statistics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
    }, []);

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'This will delete all cached files. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setClearing(true);
                            const deletedCount = await cacheManager.clearAllCache();
                            Alert.alert(
                                'Success',
                                `Cleared ${deletedCount} cache file${deletedCount !== 1 ? 's' : ''}.`
                            );
                            await loadStats();
                        } catch (error) {
                            console.error('[CacheSettings] Error clearing cache:', error);
                            Alert.alert('Error', 'Failed to clear cache.');
                        } finally {
                            setClearing(false);
                        }
                    },
                },
            ]
        );
    };

    const handleCleanup = async () => {
        try {
            setCleaning(true);
            const result = await cacheManager.performAutoCleanup();
            const totalCleaned = result.expired + result.sizeLimit;
            
            if (totalCleaned > 0) {
                Alert.alert(
                    'Cleanup Complete',
                    `Cleaned up ${totalCleaned} file${totalCleaned !== 1 ? 's' : ''}:\n` +
                    `- ${result.expired} expired file${result.expired !== 1 ? 's' : ''}\n` +
                    `- ${result.sizeLimit} file${result.sizeLimit !== 1 ? 's' : ''} exceeding size limit`
                );
            } else {
                Alert.alert('Cleanup Complete', 'No files needed cleanup.');
            }
            
            await loadStats();
        } catch (error) {
            console.error('[CacheSettings] Error performing cleanup:', error);
            Alert.alert('Error', 'Failed to perform cleanup.');
        } finally {
            setCleaning(false);
        }
    };

    const handleUpdateConfig = async (updates: Partial<CacheConfig>) => {
        try {
            cacheManager.updateConfig(updates);
            const newConfig = cacheManager.getConfig();
            setConfig(newConfig);
            Alert.alert('Success', 'Cache settings updated.');
        } catch (error) {
            console.error('[CacheSettings] Error updating config:', error);
            Alert.alert('Error', 'Failed to update cache settings.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Stack.Screen
                    options={{
                        title: 'Cache Settings',
                        headerStyle: { backgroundColor: Colors.Background },
                        headerTintColor: Colors.Text,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.Primary} />
                    <Text style={styles.loadingText}>Loading cache statistics...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Cache Settings',
                    headerStyle: { backgroundColor: Colors.Background },
                    headerTintColor: Colors.Text,
                }}
            />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                {/* Cache Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cache Statistics</Text>
                    
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Size:</Text>
                        <Text style={styles.statValue}>
                            {stats ? cacheManager.formatBytes(stats.totalSize) : '0 Bytes'}
                        </Text>
                    </View>
                    
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>File Count:</Text>
                        <Text style={styles.statValue}>{stats?.fileCount || 0}</Text>
                    </View>
                    
                    {stats?.oldestFile && (
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Oldest File:</Text>
                            <Text style={styles.statValue}>
                                {new Date(stats.oldestFile.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Offline Cache Statistics */}
                {offlineStats && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Offline Cache</Text>
                        
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Cached Media:</Text>
                            <Text style={styles.statValue}>{offlineStats.totalCached || 0}</Text>
                        </View>
                        
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Offline Cache Size:</Text>
                            <Text style={styles.statValue}>
                                {cacheManager.formatBytes(offlineStats.totalSize || 0)}
                            </Text>
                        </View>
                        
                        {offlineStats.byType && Object.keys(offlineStats.byType).length > 0 && (
                            <>
                                {Object.entries(offlineStats.byType).map(([type, data]: [string, any]) => (
                                    <View key={type} style={styles.statRow}>
                                        <Text style={styles.statLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}:</Text>
                                        <Text style={styles.statValue}>
                                            {data.count} files ({cacheManager.formatBytes(data.size)})
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                )}

                {/* Cache Configuration */}
                {config && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cache Configuration</Text>
                        
                        <View style={styles.configRow}>
                            <View style={styles.configInfo}>
                                <Text style={styles.configLabel}>Max Cache Size</Text>
                                <Text style={styles.configDescription}>
                                    Current: {cacheManager.formatBytes(config.maxSizeBytes)}
                                </Text>
                            </View>
                            <Pressable
                                style={styles.configButton}
                                onPress={() => {
                                    Alert.prompt(
                                        'Max Cache Size',
                                        'Enter new max cache size in MB (e.g., 100 for 100MB)',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Update',
                                                onPress: (value: string | undefined) => {
                                                    const mb = parseInt(value || '100', 10);
                                                    if (!isNaN(mb) && mb > 0) {
                                                        handleUpdateConfig({
                                                            maxSizeBytes: mb * 1024 * 1024,
                                                        });
                                                    }
                                                },
                                            },
                                        ],
                                        'plain-text',
                                        Math.floor(config.maxSizeBytes / 1024 / 1024).toString()
                                    );
                                }}
                            >
                                <Text style={styles.configButtonText}>Change</Text>
                            </Pressable>
                        </View>
                        
                        <View style={styles.configRow}>
                            <View style={styles.configInfo}>
                                <Text style={styles.configLabel}>TTL (Time To Live)</Text>
                                <Text style={styles.configDescription}>
                                    Current: {config.ttlDays} day{config.ttlDays !== 1 ? 's' : ''}
                                </Text>
                            </View>
                            <Pressable
                                style={styles.configButton}
                                onPress={() => {
                                    Alert.prompt(
                                        'TTL',
                                        'Enter new TTL in days (e.g., 7 for 7 days)',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Update',
                                                onPress: (value: string | undefined) => {
                                                    const days = parseInt(value || '7', 10);
                                                    if (!isNaN(days) && days > 0) {
                                                        handleUpdateConfig({ ttlDays: days });
                                                    }
                                                },
                                            },
                                        ],
                                        'plain-text',
                                        config.ttlDays.toString()
                                    );
                                }}
                            >
                                <Text style={styles.configButtonText}>Change</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>
                    
                    <Pressable
                        style={[styles.actionButton, styles.cleanupButton]}
                        onPress={handleCleanup}
                        disabled={cleaning}
                    >
                        {cleaning ? (
                            <ActivityIndicator color={Colors.White} />
                        ) : (
                            <>
                                <IconSymbol name="trash" color={Colors.White} size={20} />
                                <Text style={styles.actionButtonText}>Clean Up Cache</Text>
                            </>
                        )}
                    </Pressable>
                    
                    <Pressable
                        style={[styles.actionButton, styles.clearButton]}
                        onPress={handleClearCache}
                        disabled={clearing}
                    >
                        {clearing ? (
                            <ActivityIndicator color={Colors.White} />
                        ) : (
                            <>
                                <IconSymbol name="trash.fill" color={Colors.White} size={20} />
                                <Text style={styles.actionButtonText}>Clear All Cache</Text>
                            </>
                        )}
                    </Pressable>
                    
                    <Pressable
                        style={[styles.actionButton, styles.refreshButton]}
                        onPress={loadStats}
                        disabled={loading}
                    >
                        <IconSymbol name="arrow.clockwise" color={Colors.White} size={20} />
                        <Text style={styles.actionButtonText}>Refresh Statistics</Text>
                    </Pressable>
                </View>

                {/* Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About Cache</Text>
                    <Text style={styles.infoText}>
                        Cache files are temporary files stored on your device to improve app performance.
                        {'\n\n'}
                        • Clean Up Cache: Removes expired files and files exceeding size limits
                        {'\n'}
                        • Clear All Cache: Deletes all cached files
                        {'\n'}
                        • Cache files are automatically cleaned up when they expire or exceed size limits
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.Background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.Text,
        marginTop: 12,
        fontSize: 14,
    },
    section: {
        marginBottom: 24,
        backgroundColor: Colors.Secondary,
        borderRadius: 12,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.Text,
        marginBottom: 16,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray + '40',
    },
    statLabel: {
        fontSize: 14,
        color: Colors.Gray,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.Text,
    },
    configRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Gray + '40',
    },
    configInfo: {
        flex: 1,
        marginRight: 12,
    },
    configLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.Text,
        marginBottom: 4,
    },
    configDescription: {
        fontSize: 12,
        color: Colors.Gray,
    },
    configButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.Primary,
        borderRadius: 8,
    },
    configButtonText: {
        color: Colors.White,
        fontSize: 14,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    cleanupButton: {
        backgroundColor: Colors.Primary,
    },
    clearButton: {
        backgroundColor: '#FF3B30',
    },
    refreshButton: {
        backgroundColor: Colors.Secondary,
        borderWidth: 1,
        borderColor: Colors.Gray + '40',
    },
    actionButtonText: {
        color: Colors.White,
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        color: Colors.Gray,
        lineHeight: 20,
    },
});

