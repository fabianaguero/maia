"""Small fixture log used across repository tests."""
SAMPLE_LOG = """\
2024-01-15 10:00:01 INFO  [AuthService] User login successful user=alice
2024-01-15 10:00:02 DEBUG [PaymentService] Fetching payment method id=42
2024-01-15 10:00:03 WARN  [OrderService] Order queue depth high queue=850
2024-01-15 10:00:04 ERROR [PaymentService] Payment gateway timeout — connection refused
2024-01-15 10:00:05 INFO  [AuthService] Token refreshed user=alice
2024-01-15 10:00:06 DEBUG [OrderService] Processing order id=900
2024-01-15 10:00:07 ERROR [PaymentService] Transaction failed exception=CardDeclinedException
2024-01-15 10:00:08 INFO  [AuthService] Logout user=alice
2024-01-15 10:00:09 WARN  [OrderService] Retry attempt count=3
2024-01-15 10:00:10 INFO  [PaymentService] Payment method updated id=42
"""
