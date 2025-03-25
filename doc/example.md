# Command Integration Examples for gpt-cli

This section demonstrates how to integrate `gpt-cli` with other command-line tools to enhance your workflows by analyzing and processing information with AI assistance.

## Search Tools Integration

### DuckDuckGo CLI (ddgr)
Pipe search results from DuckDuckGo directly to `gpt-cli` for summarization and analysis:

```bash
# Summarize search results about quantum computing
ddgr "quantum computing basics" --np --num=5 --json | gpt -s "Summarize these search results in a concise and understandable manner"

# Also include search results in system prompts to create a simple FAQ chatbot
gpt -s $( ddgr 'quantum computing basics' --np --num=5 --json ) "Summarize these search results in a concise and understandable manner"

# Get technical explanations from search results
ddgr "kubernetes pod networking" --np --num=3 --json | gpt -s "Explain these technical concepts for a beginner"

# Also include search results in system prompts to create a technical lecturer
gpt -s "$( ddgr 'kubernetes pod networking' --np --num=3 --json )" "Explain these technical concepts for a beginner"
```

### Web Browsing with w3m
Extract and analyze content from websites:

```bash
# Get updates about Linux kernel from kernel.org
w3m -dump "https://www.kernel.org" | gpt -s "Extract and explain the latest Linux kernel version and changes"
gpt -s "$(w3m -dump 'https://www.kernel.org')" "Extract and explain the latest Linux kernel version and changes"

# Summarize documentation pages
w3m -dump "https://docs.docker.com/engine/reference/commandline/run/" | gpt -s "Summarize the key points of this Docker command documentation"
gpt -s "$(w3m -dump 'https://docs.docker.com/engine/reference/commandline/run/')" "Summarize the key points of this Docker command documentation"
```

## Data Processing Tools

### JSON Processing with jq
Parse and analyze JSON data from APIs:

```bash
# Analyze GitHub issues
curl -s "https://api.github.com/repos/u1and0/gpt-cli/issues" | jq -r '.[] | .title + "\n" + .body + "\n---"' | gpt -s "Analyze these GitHub issues, prioritize them, and suggest solutions"

# Process API responses
curl -s "https://api.example.com/data" | jq -r '.items[] | .name + ": " + .description' | gpt -s "Categorize these items and highlight the most significant ones"
```

### YAML Processing with yq
Parse and analyze YAML configuration files:

```bash
# Analyze Docker Compose configurations
yq eval '.services[]' docker-compose.yml | gpt -s "Analyze this Docker service configuration and suggest security and efficiency improvements"

# Review Kubernetes manifests
yq eval '.spec' deployment.yaml | gpt -s "Review this Kubernetes deployment specification and suggest best practices"
```

### XML Processing with xq
Process XML data like RSS feeds:

```bash
# Analyze news from RSS feeds
curl -s "https://news.yahoo.co.jp/rss/topics/it.xml" | xq -r '.rss.channel.item[] | .title + " - " + .description' | gpt -s "Organize these IT news by importance and briefly explain their impact"

# Process XML configurations
cat config.xml | xq | gpt -s "Analyze this XML configuration and suggest improvements"
```

## File and Document Processing

### PDF Analysis
Extract and analyze text from PDF documents:

```bash
# Summarize PDF documents
pdftotext document.pdf - | gpt -s "Summarize the main points and conclusions of this document in three key points"
gpt -s "$(pdftotext document.pdf -)" "Summarize the main points and conclusions of this document in three key points"

# Extract specific information from technical PDFs
pdftotext technical_spec.pdf - | gpt -s "Extract the technical requirements and specifications from this document"
gpt -s "$(pdftotext technical_spec.pdf -)" "Extract the technical requirements and specifications from this document"
```

### Log File Analysis
Process and analyze log files:

```bash
# Analyze error patterns in logs
find . -name "*.log" -type f -exec cat {} \; | gpt -s "Identify error patterns in these log files and suggest solutions"

# Summarize system activities from logs
cat /var/log/syslog | tail -n 100 | gpt -s "Summarize recent system activities and highlight any concerning events"
```

## System Information and Monitoring

### System Statistics
Analyze system performance data:

```bash
# Get system performance recommendations
vmstat 1 5 | gpt -s "Analyze this system state information and suggest performance optimizations"

# CPU and memory usage analysis
top -b -n 1 | gpt -s "Analyze this CPU and memory usage data and identify resource-intensive processes"
```

### Network Tools
Process network information:

```bash
# Analyze network connections
netstat -tuln | gpt -s "Explain these network connections and identify any security concerns"

# DNS record analysis
dig example.com ANY | gpt -s "Analyze these DNS records and explain their purpose"
```

## Language and Text Processing

### Translation and Language Processing
Process and translate text:

```bash
# Translate documents
cat foreign_document.txt | gpt -s "Translate this text to Japanese while preserving the original nuances"

# Improve writing
cat draft.txt | gpt -s "Edit this text to improve clarity and conciseness while maintaining the core message"
```

Using the `-f` option is functionally similar.

### Code Analysis
Analyze and improve code:

```bash
# Code review
cat source_code.py | gpt -s "Review this Python code and suggest improvements for readability and performance"

# Documentation generation
cat implementation.js | gpt -s "Generate comprehensive documentation for this JavaScript code"
```

Using the `-f` option is functionally similar.

## Weather and External Data

### Weather Information
Process weather data for insights:

```bash
# Get activity recommendations based on weather
curl -s "wttr.in/?format=%l:+%C+%t" | gpt -s "Based on this weather information, suggest suitable outdoor activities for today"

# Weather pattern analysis
curl -s "wttr.in/Tokyo?format=4" | gpt -s "Analyze this weather forecast and explain the expected weather patterns"
```

### Financial Data
Process financial information:

```bash
# Stock market analysis
curl -s "https://query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL" | jq | gpt -s "Analyze this Apple stock data and explain the key indicators"

# Currency exchange insights
curl -s "https://api.exchangerate-api.com/v4/latest/USD" | jq | gpt -s "Analyze these currency exchange rates and identify notable trends"
```

## Advanced Combinations

You can create powerful workflows by combining multiple commands:

```bash
# Research a topic, analyze it, and generate a report
ddgr "blockchain environmental impact" --np --num=5 --json | gpt -s "Synthesize these search results into a balanced analysis of blockchain technology's environmental impact" > report.md

# Monitor system, analyze performance, and suggest improvements
{ echo "System Information:"; uname -a; echo "CPU Usage:"; top -b -n 1 | head -n 20; echo "Memory Usage:"; free -h; echo "Disk Usage:"; df -h; } | gpt -s "Analyze this system information and suggest specific optimizations"
```

These examples demonstrate how `gpt-cli` can be integrated with various command-line tools to enhance productivity and extract insights from different data sources. Feel free to adapt these examples to your specific needs and workflows.


## Code execution

```
$ gpt -n -s "you are bash. generate efficiently excutable code"\
    "find .ts files on lib directory" |
    grep -ozP '```[\s\S]*?```' |
    sed '/^```/d;'
find lib -name "*.ts"
```

Generate code. It uses `grep` and `sed` to remove backquotes.


```
$ gpt -n -s "you are bash. generate efficiently excutable code"\
    "find .ts files on lib directory" |
    grep -ozP '```[\s\S]*?```' |
    sed '/^```/d;' |
    bash
lib/cli.ts
lib/command.ts
lib/file.ts
lib/input.ts
lib/llm.ts
lib/model.ts
lib/params.ts
lib/platform.ts
lib/spinner.ts
```

In addition, the generated code is piped to bash.

```
$ gpt -n -s "you are python interpreter. generate efficiently excutable code"\
    "List prime numbers from 1 to 100" |
    grep -ozP '```[\s\S]*?```' |
    sed '/^```/d;'
def is_prime(n):
    """Function to determine if a given number is prime."""
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def generate_primes(limit):
    """Function to generate a list of prime numbers from 1 to limit""""
    primes = [number for number in range(2, limit + 1) if is_prime(number)]
    return primes

# Generate prime numbers from 1 to 100
primes_1_to_100 = generate_primes(100)
print(primes_1_to_100)
```

Generate code. It uses `grep` and `sed` to remove backquotes.

```
$ gpt -n -s "you are python interpreter. generate efficiently excutable code"\
    "List prime numbers from 1 to 100" |
    grep -ozP '```[\s\S]*?```' |
    sed '/^```/d;' |
    python
[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]
```

In addition, the generated code is piped to Python interpreter.
