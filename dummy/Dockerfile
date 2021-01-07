FROM python:latest
WORKDIR WORKDIR /usr/dummyservice
RUN pip install requests
COPY updater.py .
CMD ["python","-u","updater.py"]