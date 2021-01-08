FROM python:latest
WORKDIR WORKDIR /usr/dummyservice
RUN pip install requests
COPY invalidate_cache_script.py .
CMD ["python", "-u", "invalidate_cache_script.py"]