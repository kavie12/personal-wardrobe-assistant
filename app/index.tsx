import { useColorScheme } from "@/hooks/use-color-scheme.web";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View, ViewToken } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const slides = [
    {
        id: "1",
        icon: "shirt-outline" as const,
        title: "Your Smart Wardrobe",
        description: "Organise your clothes and build outfits effortlessly in one place.",
    },
    {
        id: "2",
        icon: "sunny-outline" as const,
        title: "Weather-Aware Outfits",
        description: "Get outfit suggestions tailored to today's forecast automatically.",
    },
    {
        id: "3",
        icon: "calendar-outline" as const,
        title: "Dress for Every Occasion",
        description: "Plan ahead with schedule-based recommendations for any event.",
    },
    {
        id: "4",
        icon: "chatbox-outline" as const,
        title: "Get Style Advice",
        description: "Chat with our AI stylist for personalized outfit recommendations.",
    },
];

const OnboardingScreen = () => {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
        }
    ).current;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
            {/* Carousel */}
            <View style={{ height: height * 0.55 }} className="bg-slate-900">
                <FlatList
                    ref={flatListRef}
                    data={slides}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                    renderItem={({ item }) => (
                        <View
                            style={{ width }}
                            className="flex-1 items-center justify-center px-10 gap-y-6"
                        >
                            {/* Icon circle */}
                            <View className="w-32 h-32 rounded-full bg-slate-800 items-center justify-center">
                                <Ionicons
                                    name={item.icon}
                                    size={56}
                                    color="#FFFFFF"
                                />
                            </View>
                            <View className="items-center gap-y-3">
                                <Text className="text-2xl font-bold text-white text-center">
                                    {item.title}
                                </Text>
                                <Text className="text-slate-400 text-center text-[15px] leading-6">
                                    {item.description}
                                </Text>
                            </View>
                        </View>
                    )}
                />

                {/* Dots */}
                <View className="flex-row justify-center gap-x-2 pb-4">
                    {slides.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => flatListRef.current?.scrollToIndex({ index })}
                            activeOpacity={0.7}
                        >
                            <View
                            style={{
                                height: 8,
                                width: activeIndex === index ? 24 : 8,
                                borderRadius: 4,
                                backgroundColor: activeIndex === index ? "#ffffff" : "#334155"
                            }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 dark:bg-slate-800 mx-6" />

            {/* Auth buttons */}
            <View className="flex-1 px-6 justify-center gap-y-4">
                <View className="gap-y-2">
                    <Text className="text-2xl font-bold text-slate-800 dark:text-white">
                        Get started
                    </Text>
                    <Text className="text-slate-400">
                        Sign in or create an account to continue.
                    </Text>
                </View>

                <View className="gap-y-3 mt-2">
                    <TouchableOpacity
                        onPress={() => router.push("/login")}
                        activeOpacity={0.8}
                        className="bg-slate-800 dark:bg-white py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white dark:text-slate-800 font-semibold text-[15px]">
                            Sign In
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/register")}
                        activeOpacity={0.8}
                        className="border border-slate-200 dark:border-slate-700 py-4 rounded-2xl items-center"
                    >
                        <Text className="text-slate-800 dark:text-white font-semibold text-[15px]">
                            Create Account
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default OnboardingScreen;