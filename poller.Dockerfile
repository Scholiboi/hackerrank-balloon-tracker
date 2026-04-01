FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir requests==2.32.3 python-dotenv==1.0.1
COPY sub_status.py .
CMD ["python", "-u", "sub_status.py"]
