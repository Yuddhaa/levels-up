# Build stage
FROM rust:1.75-slim-bookworm as builder

WORKDIR /app

# Copy manifest files first to cache dependencies
COPY Cargo.toml Cargo.lock ./
#Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source code
COPY . .
# Touch main.rs to trigger rebuild
RUN touch src/main.rs
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (sqlite3, openssl)
RUN apt-get update && apt-get install -y libsqlite3-0 libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/server /app/server
# Copy migrations
COPY --from=builder /app/migrations /app/migrations

# Expose port
EXPOSE 3000

# Run the server
CMD ["./server"]
