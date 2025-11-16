import React from 'react'
import { Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Message } from '@/utils/types'
import { Colors } from '@/utils/colors'

type JobUploadsProps = {
    messages: Message[]
    onImagePress: (uri: string) => void
}

type PhotoItem = {
    id: string
    uri: string
    createdAt?: string
}

const NUM_COLUMNS = 3
const SPACING = 8

export default function JobUploads({ messages, onImagePress }: JobUploadsProps) {
    const photos = React.useMemo<PhotoItem[]>(() => {
        return messages
            .filter(
                message =>
                    !!message.imageUrl &&
                    message.content !== 'Message deleted by user'
            )
            .map(message => ({
                id: message.$id,
                uri: message.imageUrl as string,
                createdAt: message.$createdAt,
            }))
    }, [messages])

    const { width } = Dimensions.get('window')
    const itemSize = React.useMemo(() => {
        const totalSpacing = SPACING * (NUM_COLUMNS + 1)
        return Math.floor((width - totalSpacing) / NUM_COLUMNS)
    }, [width])

    if (photos.length === 0) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptySubtitle}>
                    Photos shared in this chat will show up here.
                </Text>
            </View>
        )
    }

    return (
        <FlatList
            data={photos}
            numColumns={NUM_COLUMNS}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={{ gap: SPACING }}
            ItemSeparatorComponent={() => <View style={{ height: SPACING }} />}
            renderItem={({ item }) => (
                <Pressable
                    style={[styles.imageWrapper, { width: itemSize, height: itemSize }]}
                    onPress={() => onImagePress(item.uri)}
                >
                    <Image
                        source={{ uri: item.uri }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </Pressable>
            )}
        />
    )
}

const styles = StyleSheet.create({
    listContainer: {
        padding: SPACING,
    },
    imageWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.Secondary,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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

