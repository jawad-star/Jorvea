import { profileService } from '../services';
import { UserProfile } from '../services/firebaseProfileService';

export const initializeSampleProfiles = async () => {
  try {
    // Check if profiles already exist
    const existingProfiles = await profileService.getAllUsers();
    if (existingProfiles.length > 0) {
      console.log('Sample profiles already exist');
      return;
    }

    // Create sample user profiles
    const sampleProfiles = [
      {
        uid: 'user_1',
        username: 'john_doe',
        displayName: 'John Doe',
        email: 'john@example.com',
        bio: 'Photography enthusiast 📸',
        isPrivate: false,
        isVerified: false,
      },
      {
        uid: 'user_2',
        username: 'jane_smith',
        displayName: 'Jane Smith',
        email: 'jane@example.com',
        bio: 'Travel blogger ✈️ | Food lover 🍕',
        isPrivate: false,
        isVerified: true,
      },
      {
        uid: 'user_3',
        username: 'mike_jones',
        displayName: 'Mike Jones',
        email: 'mike@example.com',
        bio: 'Tech geek 💻 | Coffee addict ☕',
        isPrivate: true,
        isVerified: false,
      },
      {
        uid: 'user_4',
        username: 'sarah_wilson',
        displayName: 'Sarah Wilson',
        email: 'sarah@example.com',
        bio: 'Artist 🎨 | Nature lover 🌿',
        isPrivate: false,
        isVerified: false,
      },
      {
        uid: 'user_5',
        username: 'alex_brown',
        displayName: 'Alex Brown',
        email: 'alex@example.com',
        bio: 'Fitness trainer 💪 | Motivational speaker',
        isPrivate: false,
        isVerified: true,
      }
    ];

    // Create profiles
    for (const profileData of sampleProfiles) {
      await profileService.updateUserProfile(profileData);
    }

    console.log('Sample profiles created successfully');
  } catch (error) {
    console.error('Error creating sample profiles:', error);
  }
};
