import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'fidelicard.myName';

export async function getMyName(): Promise<string | null> {
  return AsyncStorage.getItem(KEY);
}

export async function setMyName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEY, name.trim());
}
