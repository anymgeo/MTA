"""Read-only terrain registration: match the supplied official artwork to its clean base.

No trail geometry is inferred by this tool. Matches only establish the image transform.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / '.local/map-analysis'))
import cv2
import numpy as np

def load(filename):
    return cv2.imdecode(np.fromfile(filename, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)

reference, clean = (load(filename) for filename in sys.argv[1:3])
# Match at the same display size used for the manually inspected source.
reference = cv2.resize(reference, (1504, 1690))
sift = cv2.SIFT_create(nfeatures=16000)
a, da = sift.detectAndCompute(reference, None)
b, db = sift.detectAndCompute(clean, None)
pairs = cv2.BFMatcher().knnMatch(da, db, k=2)
good = [x for x, y in pairs if x.distance < .65 * y.distance]
src = np.float32([a[x.queryIdx].pt for x in good])
dst = np.float32([b[x.trainIdx].pt for x in good])
matrix, mask = cv2.findHomography(src, dst, cv2.RANSAC, 2)
keep = mask.ravel().astype(bool)
mapped = cv2.perspectiveTransform(src[:, None, :], matrix)[:, 0, :]
error = np.linalg.norm(mapped - dst, axis=1)[keep]
print('Reference display: 1504 x 1690; clean:', clean.shape[::-1])
print('Matches:', len(good), 'inliers:', int(keep.sum()))
print('Transform:', matrix.tolist())
print('Median/p95 error (clean pixels):', np.percentile(error, [50, 95]).tolist())
print('Inlier source extent:', src[keep].min(axis=0).tolist(), src[keep].max(axis=0).tolist())
for threshold in [0, 400, 700, 900]:
    indices = np.flatnonzero(keep & (src[:, 1] >= threshold))
    print('Source y >=', threshold, 'matches:', len(indices), 'examples:', [(src[i].round(1).tolist(), dst[i].round(1).tolist()) for i in indices[-3:]])
for lo, hi in [(0, 525), (525, 1200), (1200, 1504)]:
    indices = np.flatnonzero(keep & (src[:, 0] >= lo) & (src[:, 0] < hi))
    print('Source x:', lo, hi, 'matches:', len(indices), 'examples:', [(src[i].round(1).tolist(), dst[i].round(1).tolist()) for i in indices[:4]])
