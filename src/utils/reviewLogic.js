// 忘却曲線ロジック (簡易版SM-2アルゴリズム)
export const calculateNextReview = (currentInterval, isCorrect) => {
    let nextInterval = 0; // 次回までの日数

    if (isCorrect) {
        if (currentInterval === 0) {
            nextInterval = 1; // 初回正解 -> 1日後
        } else if (currentInterval === 1) {
            nextInterval = 3; // 1日後正解 -> 3日後
        } else {
            nextInterval = Math.ceil(currentInterval * 2.5); // 以降、間隔を2.5倍に広げる
        }
    } else {
        nextInterval = 0; // 間違えたらリセット（今日やる）
    }

    // 次回の日付を計算
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextInterval);

    return {
        interval: nextInterval,
        date: nextDate.toISOString()
    };
};