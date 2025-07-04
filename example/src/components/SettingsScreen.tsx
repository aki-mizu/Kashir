import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
  SafeAreaView,
} from 'react-native';
import { MintInfo, MintUrlModal, useWallet } from './wallet';
import { SecureStorageService } from '../services';

interface SettingsScreenProps {
  isVisible: boolean;
}

export function SettingsScreen({ isVisible }: SettingsScreenProps) {
  const [hasSeedPhrase, setHasSeedPhrase] = useState<boolean>(false);
  
  const {
    mintUrl,
    showMintUrlModal,
    promptForMintUrl,
    handleMintUrlSubmit,
    handleMintUrlModalClose,
    loadMintUrlFromStorage,
  } = useWallet();

  // Check if seed phrase exists and wallet database exists when component becomes visible
  useEffect(() => {
    const checkSeedPhrase = async () => {
      try {
        const exists = await SecureStorageService.hasSeedPhrase();
        setHasSeedPhrase(exists);
      } catch (error) {
        console.warn('Failed to check seed phrase existence:', error);
        setHasSeedPhrase(false);
      }
    };



    const loadMintUrl = async () => {
      try {
        await loadMintUrlFromStorage();
      } catch (error) {
        console.warn('Failed to load mint URL from storage:', error);
      }
    };
    
    // Only check when the screen is visible
    if (isVisible) {
      checkSeedPhrase();
      loadMintUrl();
    }
  }, [isVisible]);

  // Refresh mint URL when the modal closes (in case it was changed)
  useEffect(() => {
    if (!showMintUrlModal && isVisible) {
      loadMintUrlFromStorage();
    }
  }, [showMintUrlModal, isVisible, loadMintUrlFromStorage]);

  const handleViewSeedPhrase = async () => {
    try {
      const seedPhrase = await SecureStorageService.getSeedPhrase();
      if (seedPhrase) {
        Alert.alert(
          'Seed Phrase',
          seedPhrase,
          [
            {
              text: 'Copy to Clipboard',
              onPress: () => {
                Clipboard.setString(seedPhrase);
                Alert.alert('Copied!', 'Seed phrase copied to clipboard');
              }
            },
            { text: 'Close', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('No Seed Phrase', 'No seed phrase found in secure storage');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to retrieve seed phrase. Authentication may have been cancelled.');
    }
  };

  const handleRemoveSeedPhrase = async () => {
    Alert.alert(
      'Remove Seed Phrase',
      'Are you sure you want to remove the stored seed phrase? You should have it backed up elsewhere.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const removed = await SecureStorageService.removeSeedPhrase();
              if (removed) {
                setHasSeedPhrase(false); // Update state to hide the button
                Alert.alert('Success', 'Seed phrase removed from secure storage');
              } else {
                Alert.alert('Error', 'Failed to remove seed phrase');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove seed phrase');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet Settings</Text>
          
          {mintUrl ? (
            <View style={styles.mintInfoContainer}>
              <MintInfo 
                mintUrl={mintUrl} 
                onChangeMint={promptForMintUrl} 
              />
            </View>
          ) : (
            <Text style={styles.noSeedPhraseText}>
              No wallet created
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          {hasSeedPhrase ? (
            <>
              <TouchableOpacity style={styles.settingButton} onPress={handleViewSeedPhrase}>
                <Text style={styles.settingButtonText}>View Seed Phrase</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingButton} onPress={handleRemoveSeedPhrase}>
                <Text style={[styles.settingButtonText, styles.dangerText]}>Remove Stored Seed Phrase</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noSeedPhraseText}>
              No seed phrase stored
            </Text>
          )}
        </View>
      </View>

      <MintUrlModal
        visible={showMintUrlModal}
        onClose={handleMintUrlModalClose}
        onSubmit={handleMintUrlSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  mintInfoContainer: {
    position: 'relative',
    minHeight: 100,
  },
  settingButton: {
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#81b0ff',
  },
  dangerText: {
    color: '#ff6b6b',
  },
  noSeedPhraseText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
}); 