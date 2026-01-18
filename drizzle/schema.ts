import { sql } from "drizzle-orm";
import {
    integer,
    real,
    sqliteTable,
    text,
    primaryKey,
    index,
    unique,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// --- Users ---
export const users = sqliteTable("User", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    email: text("email").unique(),
    password: text("password"),
    phone: text("phone").unique(),
    github_id: text("github_id").unique(),
    avatar: text("avatar"),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
});

export const usersRelations = relations(users, ({ many }) => ({
    tokens: many(smsTokens),
    products: many(products),
    posts: many(posts),
    comments: many(comments),
    likes: many(likes),
    buyerChatRooms: many(chatRooms, { relationName: "buyer" }),
    sellerChatRooms: many(chatRooms, { relationName: "seller" }),
    messages: many(messages),
    purchasedProducts: many(products, { relationName: "purchased" }),
    reviewerReviews: many(reviews, { relationName: "reviewer" }),
    revieweeReviews: many(reviews, { relationName: "reviewee" }),
}));

// --- SMS Tokens ---
export const smsTokens = sqliteTable("SMSToken", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    token: text("token").notNull().unique(),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export const smsTokensRelations = relations(smsTokens, ({ one }) => ({
    user: one(users, {
        fields: [smsTokens.userId],
        references: [users.id],
    }),
}));

// --- Products ---
export const products = sqliteTable("Product", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    price: real("price").notNull(), // Prisma Float maps to SQLite REAL
    photo: text("photo").notNull(),
    description: text("description").notNull(),
    status: text("status").notNull().default("판매중"),
    soldTo: integer("soldTo").references(() => users.id, { onDelete: "set null" }),
    soldAt: integer("soldAt", { mode: "timestamp" }),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export const productsRelations = relations(products, ({ one, many }) => ({
    user: one(users, {
        fields: [products.userId],
        references: [users.id],
    }),
    soldToUser: one(users, {
        fields: [products.soldTo],
        references: [users.id],
        relationName: "purchased", // Matches users.purchasedProducts
    }),
    chatRooms: many(chatRooms),
    reviews: many(reviews),
}));

// --- Posts ---
export const posts = sqliteTable("Post", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    views: integer("views").notNull().default(0),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
    user: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
    comments: many(comments),
    likes: many(likes),
}));

// --- Comments ---
export const comments = sqliteTable("Comment", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    payload: text("payload").notNull(),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("postId")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
});

export const commentsRelations = relations(comments, ({ one }) => ({
    user: one(users, {
        fields: [comments.userId],
        references: [users.id],
    }),
    post: one(posts, {
        fields: [comments.postId],
        references: [posts.id],
    }),
}));

// --- Likes ---
export const likes = sqliteTable("Like", {
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("postId")
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
}, (t) => ({
    pk: primaryKey({ columns: [t.userId, t.postId] }),
}));

export const likesRelations = relations(likes, ({ one }) => ({
    user: one(users, {
        fields: [likes.userId],
        references: [users.id],
    }),
    post: one(posts, {
        fields: [likes.postId],
        references: [posts.id],
    }),
}));

// --- ChatRooms ---
export const chatRooms = sqliteTable("ChatRoom", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    productId: integer("productId")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    buyerId: integer("buyerId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    sellerId: integer("sellerId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
}, (t) => ({
    uniqueBuyerSellerProduct: unique().on(t.buyerId, t.sellerId, t.productId),
    buyerIdIdx: index("ChatRoom_buyerId_idx").on(t.buyerId),
    sellerIdIdx: index("ChatRoom_sellerId_idx").on(t.sellerId),
    productIdIdx: index("ChatRoom_productId_idx").on(t.productId),
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
    product: one(products, {
        fields: [chatRooms.productId],
        references: [products.id],
    }),
    buyer: one(users, {
        fields: [chatRooms.buyerId],
        references: [users.id],
        relationName: "buyer",
    }),
    seller: one(users, {
        fields: [chatRooms.sellerId],
        references: [users.id],
        relationName: "seller",
    }),
    messages: many(messages),
}));

// --- Messages ---
export const messages = sqliteTable("Message", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    payload: text("payload").notNull(),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    userId: integer("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    chatRoomId: integer("chatRoomId")
        .notNull()
        .references(() => chatRooms.id, { onDelete: "cascade" }),
}, (t) => ({
    chatRoomIdCreatedAtIdx: index("Message_chatRoomId_created_at_idx").on(t.chatRoomId, t.created_at),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
    user: one(users, {
        fields: [messages.userId],
        references: [users.id],
    }),
    chatRoom: one(chatRooms, {
        fields: [messages.chatRoomId],
        references: [chatRooms.id],
    }),
}));

// --- Reviews ---
export const reviews = sqliteTable("Review", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rating: integer("rating").notNull(),
    content: text("content"),
    created_at: integer("created_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    updated_at: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .default(sql`(CURRENT_TIMESTAMP)`),
    reviewerId: integer("reviewerId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    revieweeId: integer("revieweeId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("productId")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
}, (t) => ({
    uniqueReviewerProduct: unique().on(t.reviewerId, t.productId),
    revieweeIdIdx: index("Review_revieweeId_idx").on(t.revieweeId),
    productIdIdx: index("Review_productId_idx").on(t.productId),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    reviewer: one(users, {
        fields: [reviews.reviewerId],
        references: [users.id],
        relationName: "reviewer",
    }),
    reviewee: one(users, {
        fields: [reviews.revieweeId],
        references: [users.id],
        relationName: "reviewee",
    }),
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
}));
