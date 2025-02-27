import React from 'react';
    import { StyleSheet, Text, View, Button, ScrollView } from 'react-native';

    export default function App() {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Lifepath Adventure</Text>
            <View style={styles.featureCards}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Explore</Text>
                <Text style={styles.cardDescription}>Venture through pixelated worlds filled with mysteries.</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Battle</Text>
                <Text style={styles.cardDescription}>Engage in thrilling battles with unique enemies.</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Customize</Text>
                <Text style={styles.cardDescription}>Personalize your character and gear for the ultimate adventure.</Text>
              </View>
            </View>
            <Button title="Sign Up for Updates" onPress={() => alert('Thank you for signing up for updates!')} />
          </ScrollView>
        </View>
      );
    }

    const styles = StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      },
      scrollContainer: {
        padding: 20,
      },
      title: {
        fontSize: 32,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
      },
      featureCards: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
      },
      card: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 10,
        width: 100,
        margin: 5,
      },
      cardTitle: {
        fontSize: 18,
        color: '#fff',
      },
      cardDescription: {
        color: '#fff',
      },
    });
