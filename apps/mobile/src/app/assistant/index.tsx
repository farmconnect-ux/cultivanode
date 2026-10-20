import { colors, radius, space } from '@cultivanode/shared';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Screen, Text } from '../../ui';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  "Diagnose crop issue 📸",
  "What operations are overdue?",
  "Recommend fertilizer rate",
  "Summarize weather risk",
];

export default function AssistantRoute() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! I am your CultivaNode Field Assistant. I can help diagnose crop diseases from photos or answer questions about your farm's schedule and inventory. How can I help today?",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = (text: string, imageUri?: string) => {
    if (!text.trim() && !imageUri) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      imageUri,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiReply = "Based on your farm records, everything looks on track.";

      if (text.includes("overdue")) {
        aiReply = "You have 1 operation overdue: 'First Weeding & Scouting Pass' on Plot A. I recommend completing this before Friday's expected rainfall.";
      } else if (imageUri) {
        aiReply = "I've analyzed the photo. The spotting on the leaves strongly suggests Cassava Brown Streak Disease (CBSD). I recommend immediate removal of affected plants to prevent spread, as there is no chemical cure. Ensure you use certified disease-free stems for your next planting cycle.";
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: aiReply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      sendMessage("Please analyze this crop issue.", result.assets[0].uri);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[styles.messageRow, msg.role === 'user' ? styles.messageRowUser : styles.messageRowAi]}>
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatar}>
                <Text variant="caption" color={colors.white}>AI</Text>
              </View>
            )}
            <View style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
              {msg.imageUri && (
                <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />
              )}
              {msg.text ? (
                <Text variant="body" color={msg.role === 'user' ? colors.white : colors.ink}>
                  {msg.text}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View style={styles.aiAvatar}>
              <Text variant="caption" color={colors.white}>AI</Text>
            </View>
            <View style={[styles.bubble, styles.bubbleAi]}>
              <Text variant="body" muted>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptScroll} contentContainerStyle={styles.promptContent}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <Pressable
              key={idx}
              style={styles.promptChip}
              onPress={() => {
                if (prompt.includes("📸")) handlePickImage();
                else sendMessage(prompt);
              }}
            >
              <Text variant="caption" color={colors.leaf[800]} style={{ fontWeight: '600' }}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <Pressable style={styles.attachBtn} onPress={handlePickImage}>
            <Feather name="camera" size={24} color={colors.leaf[700]} />
          </Pressable>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about your farm..."
            placeholderTextColor={colors.muted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
          >
            <Feather name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  chatArea: { flex: 1 },
  chatContent: { padding: space[4], gap: space[4], paddingBottom: space[6] },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space[2], maxWidth: '85%' },
  messageRowUser: { alignSelf: 'flex-end' },
  messageRowAi: { alignSelf: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.leaf[800], alignItems: 'center', justifyContent: 'center' },
  bubble: { padding: space[3], borderRadius: radius.lg },
  bubbleUser: { backgroundColor: colors.leaf[600], borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 4 },
  chatImage: { width: 200, height: 200, borderRadius: radius.md, marginBottom: space[2] },
  inputArea: { backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, paddingBottom: space[4] },
  promptScroll: { maxHeight: 50 },
  promptContent: { paddingHorizontal: space[4], paddingVertical: space[2], gap: space[2] },
  promptChip: { backgroundColor: colors.leaf[50], paddingHorizontal: space[3], paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.leaf[200] },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space[4], gap: space[3], marginTop: space[2] },
  attachBtn: { padding: space[2] },
  textInput: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: colors.cream, borderRadius: radius.lg, paddingHorizontal: space[3], paddingTop: space[3], paddingBottom: space[3], fontSize: 16, color: colors.ink },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.leaf[600], alignItems: 'center', justifyContent: 'center' }
});
