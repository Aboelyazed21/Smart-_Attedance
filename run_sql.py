import mysql.connector

# Database connection configuration
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "0000",  # Set your MySQL password here if required, or leave empty if none
    "database": "smart_attendance_db"
}

try:
    print("Connecting to the database and executing the SQL script...")
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # Read the SQL file
    with open("insert_events.sql", "r", encoding="utf-8") as f:
        sql_script = f.read()

    # Split the script into individual SQL statements based on semicolons (;)
    statements = sql_script.split(';')

    for statement in statements:
        stmt = statement.strip()
        # Skip empty lines or pure SQL comments
        if not stmt or stmt.startswith('--'):
            continue
        
        # Execute the statement
        cursor.execute(stmt)
        
        # Consume any remaining result sets (such as the final validation SELECT statements)
        try:
            while cursor.nextset():
                pass
        except Exception:
            pass

    conn.commit()
    print("✨ SQL script executed successfully! All data and predictions have been populated.")

except Exception as e:
    print(f"An error occurred during execution: {e}")

finally:
    if 'cursor' in locals(): 
        cursor.close()
    if 'conn' in locals(): 
        conn.close()