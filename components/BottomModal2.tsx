import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type BottomModal2Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomModal2({ visible, onClose, children }: BottomModal2Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Background overlay - tap to close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.background} />
        </TouchableWithoutFeedback>
        
        {/* Modal content */}
        <View style={styles.container}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  background: {
    flex: 1,
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: SCREEN_HEIGHT * 0.4,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
});
